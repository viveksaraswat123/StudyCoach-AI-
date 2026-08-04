# # # from functools import reduce

# # # orders = [
# # #     {"user": "A", "amount": 100, "status": "completed"},
# # #     {"user": "B", "amount": 200, "status": "pending"},
# # #     {"user": "C", "amount": 300, "status": "completed"},
# # # ]

# # # # Step 1: Filter completed orders
# # # completed=filter(lambda o:o["status"]=="completed", orders)

# # # # Step 2: Extract amounts
# # # amounts = map(lambda o: o["amount"], completed)
# # # # Step 3: Calculate total
# # # total = reduce(lambda a, b: a + b, amounts, 0)

# # # print(total)

# # def logger(func):
# #     def wrapper():
# #         print("Function started")
# #         func()
# #         print("Function ended")
# #     return wrapper

# # @logger
# # def say_hello():
# #     print("Hello")

# # say_hello()
# import time

# def count_up_to(n):
#     for i in range(n):
#         yield i
#         time.sleep(1)

# for num in count_up_to(5):
#     print(num)

gen=(x*x for x in range(5))
for i in gen:
    print(i)