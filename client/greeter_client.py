# Copyright 2015 gRPC authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""The Python implementation of the GRPC helloworld.Greeter client."""

from __future__ import print_function
import logging

# RPC modules
import grpc

import helloworld_pb2
import helloworld_pb2_grpc

# Text gen modules
from textgenrnn import textgenrnn

# Timing/threading modules
from threading import Event

# Manages sleep/exit signals
exit = Event()

def run(msg):
    with grpc.insecure_channel('localhost:50051') as channel:
        stub = helloworld_pb2_grpc.GreeterStub(channel)
        response = stub.SayHello(helloworld_pb2.HelloRequest(name=msg))
    print("Greeter client received: " + response.message)

def quit(signo, _frame):
    print("Interrupted by %d, shutting down" % signo)
    exit.set()

if __name__ == '__main__':
    import signal
    for sig in ('TERM', 'HUP', 'INT'):
        signal.signal(getattr(signal, 'SIG'+sig), quit);

    textgen = textgenrnn()
    logging.basicConfig()
    for i in range(20):
        if exit.is_set():
            break
        res = textgen.generate(return_as_list=True)
        run(res[0])
        exit.wait(5)
