function fib(n) {
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2); 
}
let startTime=new Date().getTime();
console.log(fib(40));
console.log((new Date().getTime())-startTime);