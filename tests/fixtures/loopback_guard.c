#define _GNU_SOURCE
#include <arpa/inet.h>
#include <dlfcn.h>
#include <errno.h>
#include <netinet/in.h>
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>

/* Test-only bounded interception for the manual V2 loopback fixture. */
static pthread_mutex_t log_lock = PTHREAD_MUTEX_INITIALIZER;

static int allowed_sockaddr(const struct sockaddr *addr, socklen_t len) {
  if (addr == NULL) return 1;
  if (addr->sa_family == AF_UNIX) return 1;
  if (addr->sa_family == AF_NETLINK) return 1;
  if (addr->sa_family == AF_INET && len >= sizeof(struct sockaddr_in)) {
    const struct sockaddr_in *in = (const struct sockaddr_in *)addr;
    uint32_t host = ntohl(in->sin_addr.s_addr);
    return (host >> 24) == 127;
  }
  if (addr->sa_family == AF_INET6 && len >= sizeof(struct sockaddr_in6)) {
    const struct sockaddr_in6 *in6 = (const struct sockaddr_in6 *)addr;
    if (IN6_IS_ADDR_LOOPBACK(&in6->sin6_addr)) return 1;
    if (IN6_IS_ADDR_V4MAPPED(&in6->sin6_addr)) {
      uint32_t host = ntohl(in6->sin6_addr.s6_addr32[3]);
      return (host >> 24) == 127;
    }
    return 0;
  }
  return 0;
}

static void record_denial(const char *operation, const struct sockaddr *addr, socklen_t len) {
  const char *path = getenv("CLAUDEX_NET_GUARD_LOG");
  if (path == NULL || path[0] == '\0') return;
  char host[INET6_ADDRSTRLEN] = "unknown";
  int family = addr ? addr->sa_family : -1;
  if (family == AF_INET && len >= sizeof(struct sockaddr_in)) {
    inet_ntop(AF_INET, &((const struct sockaddr_in *)addr)->sin_addr, host, sizeof(host));
  } else if (family == AF_INET6 && len >= sizeof(struct sockaddr_in6)) {
    inet_ntop(AF_INET6, &((const struct sockaddr_in6 *)addr)->sin6_addr, host, sizeof(host));
  }
  pthread_mutex_lock(&log_lock);
  FILE *f = fopen(path, "a");
  if (f) {
    fprintf(f, "blocked %s family=%d destination=%s\n", operation, family, host);
    fclose(f);
  }
  pthread_mutex_unlock(&log_lock);
}

int connect(int fd, const struct sockaddr *addr, socklen_t len) {
  static int (*real_connect)(int, const struct sockaddr *, socklen_t);
  if (!real_connect) real_connect = dlsym(RTLD_NEXT, "connect");
  if (!allowed_sockaddr(addr, len)) {
    record_denial("connect", addr, len);
    errno = ECONNREFUSED;
    return -1;
  }
  return real_connect(fd, addr, len);
}

int bind(int fd, const struct sockaddr *addr, socklen_t len) {
  static int (*real_bind)(int, const struct sockaddr *, socklen_t);
  if (!real_bind) real_bind = dlsym(RTLD_NEXT, "bind");
  if (!allowed_sockaddr(addr, len)) {
    record_denial("bind", addr, len);
    errno = EACCES;
    return -1;
  }
  return real_bind(fd, addr, len);
}

ssize_t sendto(int fd, const void *buf, size_t len, int flags,
               const struct sockaddr *addr, socklen_t addrlen) {
  static ssize_t (*real_sendto)(int, const void *, size_t, int, const struct sockaddr *, socklen_t);
  if (!real_sendto) real_sendto = dlsym(RTLD_NEXT, "sendto");
  if (addr && !allowed_sockaddr(addr, addrlen)) {
    record_denial("sendto", addr, addrlen);
    errno = ECONNREFUSED;
    return -1;
  }
  return real_sendto(fd, buf, len, flags, addr, addrlen);
}

ssize_t sendmsg(int fd, const struct msghdr *msg, int flags) {
  static ssize_t (*real_sendmsg)(int, const struct msghdr *, int);
  if (!real_sendmsg) real_sendmsg = dlsym(RTLD_NEXT, "sendmsg");
  if (msg && msg->msg_name && !allowed_sockaddr((const struct sockaddr *)msg->msg_name, msg->msg_namelen)) {
    record_denial("sendmsg", (const struct sockaddr *)msg->msg_name, msg->msg_namelen);
    errno = ECONNREFUSED;
    return -1;
  }
  return real_sendmsg(fd, msg, flags);
}

int listen(int fd, int backlog) {
  static int (*real_listen)(int, int);
  if (!real_listen) real_listen = dlsym(RTLD_NEXT, "listen");
  struct sockaddr_storage addr;
  socklen_t len = sizeof(addr);
  static int (*real_getsockname)(int, struct sockaddr *, socklen_t *);
  if (!real_getsockname) real_getsockname = dlsym(RTLD_NEXT, "getsockname");
  if (real_getsockname(fd, (struct sockaddr *)&addr, &len) == 0 &&
      !allowed_sockaddr((struct sockaddr *)&addr, len)) {
    record_denial("listen", (struct sockaddr *)&addr, len);
    errno = EACCES;
    return -1;
  }
  return real_listen(fd, backlog);
}
