Experiments around the algorithm described in https://research.swtch.com/bisect compared to a simpler algorithm.

Plotted data for n = powers of 2 up to 128:
https://claude.site/artifacts/92f05a18-67b3-4e02-a05d-9da1435ffd44

# Simple algorithm explained

We start with knowledge that the test passes for the whole set U. Now for each item x in U simply test
U - {x}. If the test returns negative, the presence of x is critical and we keep it in the final
answer. Otherwise, it was not needed and we can remove it. Each test can be performed in isolation of the
answer from the other ones. This solution always takes exactly n tests.

# Optimality for the worse case

This solution is optimal for the worse case, because there are 2^n subsets of U and each test allows us to increase the space of solutions by 2 only (since it is yes/no answer). If there is a solution with less than n tests in worse case, it will not be able to differentiate between two subsets.

# Best and Worst case analysis for bisect methods

For both bisect methods the worse case scenario is X = U, which requires 2*n-1 tests (when n is power of 2).

Can be proven by recursion:
f(2^0) = 2^1 - 1 = 1 (base)
f(2^n) = 2 * f(2^n-1) = 2^n - 1 
because for X = U, both functions unconditionally will recurse into left and right branches with 2^n-1 target list.

Similarly, for both methods the best case scenarios is X = empty set, which requires 1 test only.
This is trivially seen as we do a single check check before the first recursion that would return [];