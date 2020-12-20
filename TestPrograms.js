double mulPlusMul(double a, double b){
    double add(double c, double d){
        return c+d;
    }
    return add(a*b,a*b);
}

double count=0;

for (double i=-5;i<=5;i=i+1){
    for (double j=-5;j<=5;j=j+1){
        double value=mulPlusMul(i,j);
        if (value==0) count=count+1; else
        print(tostring(i*2,0)+"*"+tostring(j,0)+"="+tostring(value,0));
    }
}
print(tostring(count,nil));
exit count;