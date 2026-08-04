"use client";

import { YStack, XStack, H1, Paragraph, SizableText } from '@hanzo/gui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Progress, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, PieChart, Activity, Bell, Settings } from "lucide-react";

const portfolio = {
  totalValue: 125231.89,
  dailyChange: 2451.32,
  dailyChangePercent: 2.1,
  totalInvested: 98000,
  totalProfit: 27231.89,
  profitPercent: 27.8
};

const holdings = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    amount: 1.5,
    value: 65234.50,
    price: 43489.67,
    change24h: 3.2,
    allocation: 52.1,
    icon: "₿"
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    amount: 12.3,
    value: 35421.20,
    price: 2880.75,
    change24h: 5.8,
    allocation: 28.3,
    icon: "Ξ"
  },
  {
    symbol: "SOL",
    name: "Solana",
    amount: 150,
    value: 12675.50,
    price: 84.50,
    change24h: -2.1,
    allocation: 10.1,
    icon: "◎"
  },
  {
    symbol: "MATIC",
    name: "Polygon",
    amount: 5000,
    value: 6500.00,
    price: 1.30,
    change24h: 1.5,
    allocation: 5.2,
    icon: "Ⓜ"
  },
  {
    symbol: "DOT",
    name: "Polkadot",
    amount: 800,
    value: 5400.69,
    price: 6.75,
    change24h: -0.8,
    allocation: 4.3,
    icon: "●"
  }
];

const recentTransactions = [
  { type: "buy", asset: "BTC", amount: 0.1, value: 4348.96, time: "2 hours ago" },
  { type: "sell", asset: "ETH", amount: 2, value: 5761.50, time: "5 hours ago" },
  { type: "buy", asset: "SOL", amount: 50, value: 4225.00, time: "Yesterday" },
  { type: "receive", asset: "MATIC", amount: 1000, value: 1300.00, time: "2 days ago" },
  { type: "send", asset: "DOT", amount: 100, value: 675.00, time: "3 days ago" }
];

const priceAlerts = [
  { asset: "BTC", condition: "above", price: 45000, active: true },
  { asset: "ETH", condition: "below", price: 2500, active: true },
  { asset: "SOL", condition: "above", price: 100, active: false }
];

export default function CryptoPortfolio() {
  return (
    <YStack minHeight="100%" backgroundColor="$background" padding="$5">
      <YStack maxWidth={1280} alignSelf="center" rowGap="$5">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between">
          <div>
            <H1 fontSize="$10" fontWeight="500">Crypto Portfolio</H1>
            <Paragraph color="$color11">Built with @hanzo/ui components</Paragraph>
          </div>
          <XStack alignItems="center" gap="$2">
            <Button variant="outline" size="icon">
              <Bell size={16} />
            </Button>
            <Button variant="outline" size="icon">
              <Settings size={16} />
            </Button>
            <Button>
              <Wallet size={16} />
              Add Transaction
            </Button>
          </XStack>
        </XStack>

        {/* Portfolio Overview Cards */}
        <YStack gap="$4">
          <Card>
            <CardHeader flexDirection="row" alignItems="center" justifyContent="space-between" rowGap="$0" paddingBottom="$2">
              <CardTitle fontSize="$3" fontWeight="500">Portfolio Value</CardTitle>
              <DollarSign size={16} />
            </CardHeader>
            <CardContent>
              <YStack><SizableText fontSize="$8" fontWeight="500">${portfolio.totalValue.toLocaleString()}</SizableText></YStack>
              <XStack alignItems="center" gap="$1">
                {portfolio.dailyChangePercent > 0 ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                <SizableText fontSize="$1" {...{ color: portfolio.dailyChangePercent > 0 ? "$green10" : "$red10" }}>
                  ${Math.abs(portfolio.dailyChange).toLocaleString()} ({portfolio.dailyChangePercent}%)
                </SizableText>
                <SizableText fontSize="$1" color="$color11">today</SizableText>
              </XStack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader flexDirection="row" alignItems="center" justifyContent="space-between" rowGap="$0" paddingBottom="$2">
              <CardTitle fontSize="$3" fontWeight="500">Total Profit</CardTitle>
              <TrendingUp size={16} />
            </CardHeader>
            <CardContent>
              <YStack>
                <SizableText fontSize="$8" fontWeight="500" color="$green10">
                  +${portfolio.totalProfit.toLocaleString()}
                </SizableText>
              </YStack>
              <YStack>
                <SizableText fontSize="$1" color="$color11">
                  +{portfolio.profitPercent}% all time
                </SizableText>
              </YStack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader flexDirection="row" alignItems="center" justifyContent="space-between" rowGap="$0" paddingBottom="$2">
              <CardTitle fontSize="$3" fontWeight="500">Total Invested</CardTitle>
              <Wallet size={16} />
            </CardHeader>
            <CardContent>
              <YStack><SizableText fontSize="$8" fontWeight="500">${portfolio.totalInvested.toLocaleString()}</SizableText></YStack>
              <YStack><SizableText fontSize="$1" color="$color11">Principal amount</SizableText></YStack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader flexDirection="row" alignItems="center" justifyContent="space-between" rowGap="$0" paddingBottom="$2">
              <CardTitle fontSize="$3" fontWeight="500">Assets</CardTitle>
              <PieChart size={16} />
            </CardHeader>
            <CardContent>
              <YStack><SizableText fontSize="$8" fontWeight="500">{holdings.length}</SizableText></YStack>
              <YStack><SizableText fontSize="$1" color="$color11">Cryptocurrencies</SizableText></YStack>
            </CardContent>
          </Card>
        </YStack>

        {/* Main Content Tabs */}
        <Tabs defaultValue="holdings" rowGap="$4">
          <XStack alignItems="center" justifyContent="space-between">
            <TabsList>
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="alerts">Price Alerts</TabsTrigger>
            </TabsList>
            <Select defaultValue="24h">
              <SelectTrigger width="$14">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </XStack>

          <TabsContent value="holdings" rowGap="$4">
            <YStack gap="$4">
              {/* Holdings List */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Holdings</CardTitle>
                  <CardDescription>Current cryptocurrency positions</CardDescription>
                </CardHeader>
                <CardContent>
                  <YStack rowGap="$4">
                    {holdings.map((coin) => (
                      <XStack key={coin.symbol} alignItems="center" justifyContent="space-between">
                        <XStack alignItems="center" gap="$3">
                          <XStack width="$7" height="$7" borderRadius="$10" backgroundColor="$color12" alignItems="center" justifyContent="center">
                            <SizableText fontWeight="500">{coin.icon}</SizableText>
                          </XStack>
                          <div>
                            <Paragraph fontWeight="500">{coin.name}</Paragraph>
                            <Paragraph fontSize="$3" color="$color11">
                              {coin.amount} {coin.symbol}
                            </Paragraph>
                          </div>
                        </XStack>
                        <YStack>
                          <Paragraph fontWeight="500" textAlign="right">${coin.value.toLocaleString()}</Paragraph>
                          <XStack alignItems="center" justifyContent="flex-end" gap="$1">
                            {coin.change24h > 0 ? (
                              <ArrowUpRight size={12} />
                            ) : (
                              <ArrowDownRight size={12} />
                            )}
                            <SizableText fontSize="$3" {...{ color: coin.change24h > 0 ? "$green10" : "$red10" }}>
                              {Math.abs(coin.change24h)}%
                            </SizableText>
                          </XStack>
                        </YStack>
                      </XStack>
                    ))}
                  </YStack>
                </CardContent>
              </Card>

              {/* Allocation Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Allocation</CardTitle>
                  <CardDescription>Asset distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <YStack rowGap="$4">
                    {holdings.map((coin) => (
                      <div key={coin.symbol}>
                        <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                          <XStack alignItems="center" gap="$2">
                            <SizableText fontWeight="500">{coin.symbol}</SizableText>
                            <Badge variant="outline">{coin.allocation}%</Badge>
                          </XStack>
                          <SizableText fontSize="$3" color="$color11">
                            ${coin.value.toLocaleString()}
                          </SizableText>
                        </XStack>
                        <Progress value={coin.allocation} height="$2" />
                      </div>
                    ))}
                  </YStack>
                </CardContent>
              </Card>
            </YStack>

            {/* Performance Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Performance</CardTitle>
                <CardDescription>Value over time</CardDescription>
              </CardHeader>
              <CardContent>
                <XStack height={300} alignItems="center" justifyContent="center" backgroundColor="$color3" borderRadius="$2">
                  <YStack>
                    <Activity size={48} />
                    <Paragraph color="$color11" textAlign="center">Performance Chart (@hanzo/ui)</Paragraph>
                  </YStack>
                </XStack>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" rowGap="$4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest crypto activity</CardDescription>
              </CardHeader>
              <CardContent>
                <YStack rowGap="$4">
                  {recentTransactions.map((tx, i) => (
                    <XStack key={i} alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" gap="$3">
                        <XStack width="$6" height="$6" borderRadius="$10" alignItems="center" justifyContent="center" {...{ backgroundColor: tx.type === "buy" ? "#dcfce7" : tx.type === "sell" ? "#fee2e2" :
                          tx.type === "receive" ? "rgba(23,23,23,0.1)" :
                          "#ffedd5" }}>
                          {tx.type === "buy" || tx.type === "receive" ? (
                            <ArrowDownRight size={16} />
                          ) : (
                            <ArrowUpRight size={16} />
                          )}
                        </XStack>
                        <div>
                          <Paragraph fontWeight="500" textTransform="capitalize">{tx.type} {tx.asset}</Paragraph>
                          <Paragraph fontSize="$3" color="$color11">{tx.time}</Paragraph>
                        </div>
                      </XStack>
                      <YStack>
                        <Paragraph fontWeight="500" textAlign="right">${tx.value.toLocaleString()}</Paragraph>
                        <Paragraph fontSize="$3" color="$color11" textAlign="right">{tx.amount} {tx.asset}</Paragraph>
                      </YStack>
                    </XStack>
                  ))}
                </YStack>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </YStack>
    </YStack>
  );
}