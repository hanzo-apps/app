"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Avatar, AvatarFallback } from "@hanzo/ui";
import { ScrollArea } from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import {
  Gamepad2,
  Users,
  Trophy,
  Send,
  Crown,
  Swords,
  Loader2,
  Wifi,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  name: string;
  mode: string;
  players: number;
  capacity: number;
  ping: number;
  status: "open" | "in-game";
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
}

interface LeaderRow {
  rank: number;
  name: string;
  wins: number;
  rating: number;
}

const INITIAL_ROOMS: Room[] = [
  { id: "r1", name: "Neon Arena", mode: "Deathmatch", players: 6, capacity: 8, ping: 24, status: "open" },
  { id: "r2", name: "Capture Flag #3", mode: "CTF", players: 10, capacity: 10, ping: 41, status: "in-game" },
  { id: "r3", name: "Casual Lobby", mode: "Free-for-all", players: 3, capacity: 12, ping: 18, status: "open" },
  { id: "r4", name: "Ranked Duel", mode: "1v1", players: 1, capacity: 2, ping: 33, status: "open" }
];

const LEADERBOARD: LeaderRow[] = [
  { rank: 1, name: "Vortex", wins: 312, rating: 2480 },
  { rank: 2, name: "Nova", wins: 287, rating: 2390 },
  { rank: 3, name: "Echo", wins: 254, rating: 2310 },
  { rank: 4, name: "Raptor", wins: 221, rating: 2205 },
  { rank: 5, name: "Pixel", wins: 198, rating: 2140 }
];

export default function MultiplayerGameLobby() {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [matchmaking, setMatchmaking] = useState(false);
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", user: "Nova", text: "gg everyone, good matches!" },
    { id: "2", user: "Echo", text: "anyone up for ranked?" }
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleMatchmake = async () => {
    if (matchmaking) return;
    setMatchmaking(true);
    await new Promise((resolve) => setTimeout(resolve, 1600));
    setMatchmaking(false);
    setJoinedRoom("r1");
    setRooms((prev) =>
      prev.map((r) => (r.id === "r1" ? { ...r, players: Math.min(r.players + 1, r.capacity) } : r))
    );
  };

  const joinRoom = (id: string) => {
    const room = rooms.find((r) => r.id === id);
    if (!room || room.status === "in-game" || room.players >= room.capacity) return;
    setJoinedRoom(id);
    setRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, players: r.players + 1 } : r))
    );
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now().toString(), user: "You", text: chatInput }]);
    setChatInput("");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#fd4444] to-[#ff6b6b] flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Multiplayer Game Lobby</CardTitle>
                  <CardDescription>Powered by @hanzo/ui components</CardDescription>
                </div>
              </div>
              <Button
                onClick={handleMatchmake}
                disabled={matchmaking}
                className="bg-gradient-to-r from-[#fd4444] to-[#ff6b6b]"
              >
                {matchmaking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finding match…
                  </>
                ) : (
                  <>
                    <Swords className="w-4 h-4 mr-2" />
                    Quick Match
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* Rooms + leaderboard */}
          <Tabs defaultValue="rooms">
            <TabsList className="grid w-full grid-cols-2 max-w-sm">
              <TabsTrigger value="rooms">
                <Users className="w-4 h-4 mr-2" />
                Rooms
              </TabsTrigger>
              <TabsTrigger value="leaderboard">
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rooms" className="mt-4 space-y-3">
              {rooms.map((room) => {
                const full = room.players >= room.capacity;
                const joined = joinedRoom === room.id;
                return (
                  <Card key={room.id} className={cn(joined && "border-[#fd4444]")}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{room.name}</h3>
                          {room.status === "in-game" ? (
                            <Badge variant="secondary">In game</Badge>
                          ) : (
                            <Badge variant="outline">Open</Badge>
                          )}
                          {joined && <Badge className="bg-[#fd4444]">Joined</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{room.mode}</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {room.players}/{room.capacity}
                          </span>
                          <span className="flex items-center gap-1">
                            <Wifi className="w-3.5 h-3.5" />
                            {room.ping}ms
                          </span>
                        </div>
                      </div>
                      <Button
                        variant={joined ? "secondary" : "outline"}
                        size="sm"
                        disabled={room.status === "in-game" || full || joined}
                        onClick={() => joinRoom(room.id)}
                      >
                        {joined ? "Joined" : full ? "Full" : "Join"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {LEADERBOARD.map((row) => (
                    <div
                      key={row.rank}
                      className="flex items-center justify-between px-4 py-3 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "w-6 text-center font-bold",
                            row.rank === 1 && "text-yellow-500"
                          )}
                        >
                          {row.rank === 1 ? <Crown className="w-4 h-4 mx-auto" /> : row.rank}
                        </span>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{row.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{row.name}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-muted-foreground">{row.wins} wins</span>
                        <span className="font-semibold">{row.rating}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Lobby chat */}
          <Card className="flex flex-col h-[520px]">
            <CardHeader className="border-b py-3">
              <CardTitle className="text-base">Lobby Chat</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className="flex gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className={cn(m.user === "You" && "bg-[#fd4444]/10 text-[#fd4444]")}>
                        {m.user[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-xs font-medium">{m.user}</span>
                      <p className="text-sm text-muted-foreground">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-3 flex gap-2">
              <Input
                placeholder="Message lobby…"
                value={chatInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") sendChat();
                }}
              />
              <Button size="icon" onClick={sendChat} disabled={!chatInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
