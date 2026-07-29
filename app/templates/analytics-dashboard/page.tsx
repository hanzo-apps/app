"use client";

import { YStack, XStack, H1, Paragraph, SizableText } from '@hanzo/gui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Progress } from '@hanzo/ui';
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
    icon: <DollarSign size={16} />
  },
  {
    title: "Active Users",
    value: "2,350",
    change: "+15.3%",
    trend: "up",
    icon: <Users size={16} />
  },
  {
    title: "Sales",
    value: "12,234",
    change: "+19%",
    trend: "up",
    icon: <CreditCard size={16} />
  },
  {
    title: "Active Now",
    value: "573",
    change: "-2.4%",
    trend: "down",
    icon: <Activity size={16} />
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
    <YStack minHeight="100%" backgroundColor="$background" padding="$5">
      <YStack maxWidth={1280} alignSelf="center" rowGap="$5">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between">
          <div>
            <H1 fontSize="$10" fontWeight="500">Analytics Dashboard</H1>
            <Paragraph color="$color11">Built with @hanzo/ui components</Paragraph>
          </div>
          <XStack alignItems="center" gap="$2">
            <Select defaultValue="7d">
              <SelectTrigger width={180}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" gap="$2">
              <Calendar size={16} />
              Pick Date
            </Button>
            <Button gap="$2">
              <Download size={16} />
              Export
            </Button>
          </XStack>
        </XStack>

        {/* Metric Cards */}
        <YStack gap="$4">
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader flexDirection="row" alignItems="center" justifyContent="space-between" rowGap="$0" paddingBottom="$2">
                <CardTitle fontSize="$3" fontWeight="500">
                  {metric.title}
                </CardTitle>
                <SizableText width="$6" height="$6" borderRadius="$10" backgroundColor="#171717]/1" alignItems="center" justifyContent="center" color="#171717" display="flex" flexDirection="row">
                  {metric.icon}
                </SizableText>
              </CardHeader>
              <CardContent>
                <SizableText fontSize="$8" fontWeight="500" display="flex" flexDirection="column">{metric.value}</SizableText>
                <SizableText alignItems="center" gap="$1" fontSize="$1" display="flex" flexDirection="row">
                  {metric.trend === "up" ? (
                    <TrendingUp size={12} color="$green10" />
                  ) : (
                    <TrendingDown size={12} color="$red10" />
                  )}
                  <SizableText {...{ color: metric.trend === "up" ? "$green10" : "$red10" }}>
                    {metric.change}
                  </SizableText>
                  <SizableText color="$color11">from last month</SizableText>
                </SizableText>
              </CardContent>
            </Card>
          ))}
        </YStack>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" rowGap="$4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" rowGap="$4">
            <YStack gap="$4">
              {/* Chart Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>Monthly revenue for the current year</CardDescription>
                </CardHeader>
                <CardContent>
                  <XStack height={300} alignItems="center" justifyContent="center" backgroundColor="$color3" borderRadius="$2">
                    <Paragraph color="$color11">Chart Component (@hanzo/ui)</Paragraph>
                  </XStack>
                </CardContent>
              </Card>

              {/* Recent Sales */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>You made 265 sales this month.</CardDescription>
                </CardHeader>
                <CardContent>
                  <YStack rowGap="$4">
                    {recentSales.map((sale, i) => (
                      <XStack key={i} alignItems="center">
                        <SizableText width={36} height={36} borderRadius="$10" backgroundColor="#171717]/1" alignItems="center" justifyContent="center" fontSize="$3" fontWeight="500" color="#171717" display="flex" flexDirection="row">
                          {sale.name.split(" ").map(n => n[0]).join("")}
                        </SizableText>
                        <YStack marginLeft="$4" rowGap="$1" flex={1}>
                          <Paragraph fontSize="$3" fontWeight="500">{sale.name}</Paragraph>
                          <Paragraph fontSize="$3" color="$color11">{sale.email}</Paragraph>
                        </YStack>
                        <SizableText fontWeight="500" display="flex" flexDirection="column">{sale.amount}</SizableText>
                      </XStack>
                    ))}
                  </YStack>
                </CardContent>
              </Card>
            </YStack>

            {/* Additional Stats */}
            <YStack gap="$4">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Rate</CardTitle>
                  <CardDescription>Visitor to customer conversion</CardDescription>
                </CardHeader>
                <CardContent>
                  <YStack rowGap="$2">
                    <XStack alignItems="center" justifyContent="space-between">
                      <SizableText fontSize="$3">Rate</SizableText>
                      <SizableText fontSize="$3" fontWeight="500">3.2%</SizableText>
                    </XStack>
                    <Progress value={32} height="$2" className="[&>div]:bg-[#171717]" />
                    <Paragraph fontSize="$1" color="$color11">
                      +0.5% from last month
                    </Paragraph>
                  </YStack>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avg. Order Value</CardTitle>
                  <CardDescription>Average purchase amount</CardDescription>
                </CardHeader>
                <CardContent>
                  <YStack rowGap="$2">
                    <SizableText fontSize="$8" fontWeight="500" display="flex" flexDirection="column">$89.42</SizableText>
                    <XStack alignItems="center" gap="$2">
                      <Badge variant="outline" color="$green10" borderColor="$green10">
                        <TrendingUp size={12} />
                        12%
                      </Badge>
                      <SizableText fontSize="$1" color="$color11">vs last month</SizableText>
                    </XStack>
                  </YStack>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Satisfaction</CardTitle>
                  <CardDescription>Based on reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <YStack rowGap="$2">
                    <SizableText fontSize="$8" fontWeight="500" display="flex" flexDirection="column">4.8/5.0</SizableText>
                    <XStack alignItems="center" gap="$1">
                      {[...Array(5)].map((_, i) => (
                        <YStack
                          key={i}
                          width="$4" height="$4" borderRadius="$2" {...{ backgroundColor: i < 4 ? "$yellow8" : "$color3" }}
  />
                      ))}
                    </XStack>
                    <Paragraph fontSize="$1" color="$color11">
                      Based on 1,234 reviews
                    </Paragraph>
                  </YStack>
                </CardContent>
              </Card>
            </YStack>
          </TabsContent>
        </Tabs>
      </YStack>
    </YStack>
  );
}