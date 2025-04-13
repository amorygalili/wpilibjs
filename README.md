# wpilibjs



## My experience creating this project with AI

- I asked it to convert wpimath because to me that seemed like it was less dependent on other packages, would be the easiest to convert from Java/C++ to javascript, and would be the easiest to verify. I was impressed with the results. Scanning through the code it seemed pretty similar to the original implementation, and it generated a lot of useful looking unit tests with high coverage and very little mocking. The code was generated using Augment agent. The code it generated had a lot of errors and bugs, but it was able to fix most of them by automatically running and checking the unit tests it generated.