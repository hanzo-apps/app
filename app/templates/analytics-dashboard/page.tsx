"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hanzo/ui";
import { Progress } from "@hanzo/ui";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  CreditCard,
  Download,
  Calendar
} from "lucide-react";

// Metric cards data
const metrics = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    trend: "up",
    icon: <DollarSign className="w-4 h-4" />
  },
  {
    title: "Active Users",
    value: "2,350",
    change: "+15.3%",
    trend: "up",
    icon: <Users className="w-4 h-4" />
  },
  {
    title: "Sales",
    value: "12,234",
    change: "+19%",
    trend: "up",
    icon: <CreditCard className="w-4 h-4" />
  },
  {
    title: "Active Now",
    value: "573",
    change: "-2.4%",
    trend: "down",
    icon: <Activity className="w-4 h-4" />
  }
];

// Recent sales data
const recentSales = [
  { name: "Olivia Martin", email: "olivia@example.com", amount: "$1,999.00" },
  { name: "Jackson Lee", email: "jackson@example.com", amount: "$39.00" },
  { name: "Isabella Nguyen", email: "isabella@example.com", amount: "$299.00" },
  { name: "William Kim", email: "will@example.com", amount: "$99.00" },
  { name: "Sofia Davis", email: "sofia@example.com", amount: "$39.00" }
];

export default function AnalyticsDashboard() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Built with @hanzo/ui components</p>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="7d">
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Pick Date
            </Button>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <div className="w-8 h-8 rounded-full bg-[#fd4444]/10 flex items-center justify-center text-[#fd4444]">
                  {metric.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center gap-1 text-xs">
                  {metric.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                  <span className={metric.trend === "up" ? "text-green-600" : "text-red-600"}>
                    {metric.change}
                  </span>
                  <span className="text-muted-foreground">from last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              {/* Chart Card */}
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>Monthly revenue for the current year</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-muted rounded">
                    <p className="text-muted-foreground">Chart Component (@hanzo/ui)</p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Sales */}
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>You made 265 sales this month.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentSales.map((sale, i) => (
                      <div key={i} className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-[#fd4444]/10 flex items-center justify-center text-sm font-medium text-[#fd4444]">
                          {sale.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="ml-4 space-y-1 flex-1">
                          <p className="text-sm font-medium">{sale.name}</p>
                          <p className="text-sm text-muted-foreground">{sale.email}</p>
                        </div>
                        <div className="font-medium">{sale.amount}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Rate</CardTitle>
                  <CardDescription>Visitor to customer conversion</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rate</span>
                      <span className="text-sm font-medium">3.2%</span>
                    </div>
                    <Progress value={32} className="h-2 [&>div]:bg-[#fd4444]" />
                    <p className="text-xs text-muted-foreground">
                      +0.5% from last month
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avg. Order Value</CardTitle>
                  <CardDescription>Average purchase amount</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">$89.42</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        12%
                      </Badge>
                      <span className="text-xs text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Satisfaction</CardTitle>
                  <CardDescription>Based on reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">4.8/5.0</div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded ${
                            i < 4 ? "bg-yellow-400" : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Based on 1,234 reviews
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}