import time
import collections

class RateLimiter:
    def __init__(self, max_requests=10, period=60):
        self.max_requests = max_requests
        self.period = period
        self.requests = collections.deque(maxlen=max_requests)
    
    def wait_if_needed(self):
        while len(self.requests) >= self.max_requests and (time.time() - self.requests[0] < self.period):
            wait_time = self.period - (time.time() - self.requests[0])
            print(f"Límite de peticiones alcanzado. Esperando {wait_time:.2f} segundos...")
            time.sleep(wait_time)
        self.requests.append(time.time())
