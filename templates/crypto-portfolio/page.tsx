"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Progress } from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hanzo/ui";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Activity,
  Download,
  Bell,
  Settings
} from "lucide-react";

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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Crypto Portfolio</h1>
            <p className="text-muted-foreground">Built with @hanzo/ui components</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
            <Button>
              <Wallet className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Portfolio Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolio.totalValue.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-xs">
                {portfolio.dailyChangePercent > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                <span className={portfolio.dailyChangePercent > 0 ? "text-green-600" : "text-red-600"}>
                  ${Math.abs(portfolio.dailyChange).toLocaleString()} ({portfolio.dailyChangePercent}%)
                </span>
                <span className="text-muted-foreground">today</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +${portfolio.totalProfit.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                +{portfolio.profitPercent}% all time
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolio.totalInvested.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Principal amount</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assets</CardTitle>
              <PieChart className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{holdings.length}</div>
              <div className="text-xs text-muted-foreground">Cryptocurrencies</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="holdings" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="alerts">Price Alerts</TabsTrigger>
            </TabsList>
            <Select defaultValue="24h">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="holdings" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Holdings List */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Your Holdings</CardTitle>
                  <CardDescription>Current cryptocurrency positions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {holdings.map((coin) => (
                      <div key={coin.symbol} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                            {coin.icon}
                          </div>
                          <div>
                            <p className="font-medium">{coin.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {coin.amount} {coin.symbol}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${coin.value.toLocaleString()}</p>
                          <div className="flex items-center justify-end gap-1">
                            {coin.change24h > 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-green-600" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-red-600" />
                            )}
                            <span className={`text-sm ${coin.change24h > 0 ? "text-green-600" : "text-red-600"}`}>
                              {Math.abs(coin.change24h)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Allocation Chart */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Portfolio Allocation</CardTitle>
                  <CardDescription>Asset distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {holdings.map((coin) => (
                      <div key={coin.symbol}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{coin.symbol}</span>
                            <Badge variant="outline">{coin.allocation}%</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            ${coin.value.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={coin.allocation} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Performance</CardTitle>
                <CardDescription>Value over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-muted rounded">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Performance Chart (@hanzo/ui)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest crypto activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((tx, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === "buy" ? "bg-green-100" :
                          tx.type === "sell" ? "bg-red-100" :
                          tx.type === "receive" ? "bg-blue-100" :
                          "bg-orange-100"
                        }`}>
                          {tx.type === "buy" || tx.type === "receive" ? (
                            <ArrowDownRight className={`w-4 h-4 ${
                              tx.type === "buy" ? "text-emerald-600" : "text-sky-600"
                            }`} />
                          ) : (
                            <ArrowUpRight className={`w-4 h-4 ${
                              tx.type === "sell" ? "text-rose-600" : "text-amber-600"
                            }`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{tx.type} {tx.asset}</p>
                          <p className="text-sm text-muted-foreground">{tx.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${tx.value.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{tx.amount} {tx.asset}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}