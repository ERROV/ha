'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import {
  UserCheck,
  RefreshCw,
  ListOrdered,
  AlertTriangle,
  MapPin,
  Loader2,
} from 'lucide-react';
import { toast } from "react-hot-toast";
import { Button } from '@/components/ui/button';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const QueueStatus = () => {
  const { data: session } = useSession();
  const user = session?.user as { id: string; name: string; role: string } | undefined;
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [popup, setPopup] = useState<{ action: () => void; title: string; description?: string } | null>(null);

  // Admin break request entries fetching
  const { data: breakRequests, mutate: mutateBreakRequests } = useSWR(
    user?.role === 'admin' ? "/api/breaks/admin" : null,
    fetcher,
    {
      refreshInterval: 1000,
      dedupingInterval: 0,
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onSuccess: () => setLastUpdated(new Date().toLocaleTimeString()),
    }
  );

  // Global queue records for all network users
  const { data: queueData, error, isLoading, mutate } = useSWR(
    '/api/breaks/queue',
    fetcher,
    {
      refreshInterval: 10000,
      onSuccess: () => setLastUpdated(new Date().toLocaleTimeString())
    }
  );

  const confirmAction = (title: string, description: string, action: () => void) => {
    setPopup({ title, description, action });
  };

  const handleBreakRequestAction = (id: string, status: "approved" | "rejected") => {
    confirmAction(
      `${status === "approved" ? "Approve" : "Reject"} Break Request`,
      `Are you sure you want to officially ${status} this break window?`,
      async () => {
        try {
          const res = await fetch(`/api/breaks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
          if (!res.ok) throw new Error("Failed to update break request");
          mutateBreakRequests();
          mutate(); // Synchronize queue view
          toast.success(`Break request ${status}`);
        } catch {
          toast.error("Failed to process request status");
        }
      }
    );
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    if (user?.role === 'admin') {
      await mutateBreakRequests();
    }
    await mutate();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const closePopup = () => setPopup(null);

  // Admin View (Full review capacity)
  if (user?.role === 'admin') {
    return (
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border transition-colors duration-300 flex flex-col h-full">
        <div className="flex items-center justify-between mb-5 gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-lg shrink-0">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">Break Requests Queue</h2>
              <p className="text-muted-foreground text-[11px] mt-0.5">Admin monitor - all active allocations</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshData}
            disabled={isRefreshing}
            className="w-8 h-8 shrink-0 rounded-lg"
            aria-label="Refresh view"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12 my-auto">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-destructive text-xs font-semibold my-auto">
            Failed to sync live stream records
          </div>
        ) : !breakRequests || breakRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs my-auto">
            No active break requests in operational pipeline
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {breakRequests.map((req: any) => (
              <div
                key={req._id || req.id}
                className={`p-3 rounded-xl border transition-all text-xs ${
                  req.userId === user?.id
                    ? 'bg-primary/5 border-primary/40'
                    : 'bg-muted/30 border-border hover:border-primary/30'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-bold text-foreground line-clamp-1">{req.userName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'approved'
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : req.status === 'rejected'
                            ? 'bg-destructive/10 text-destructive border border-destructive/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}
                      >
                        {req.status}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Pos: #{req.position}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Wait: ~{req.estimatedWaitMinutes}m
                    </p>
                    {req.expiresAt && (
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        Until: {new Date(req.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Control Action Trigger Buttons */}
                {req.status === 'pending' && (
                  <div className="flex gap-2 mt-2.5 justify-end pt-2 border-t border-border/40">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 px-2.5 text-[10px] font-bold"
                      onClick={() => handleBreakRequestAction(req._id || req.id, "rejected")}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 px-2.5 text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleBreakRequestAction(req._id || req.id, "approved")}
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 text-[10px] text-muted-foreground text-center font-mono">
          Synced: {lastUpdated}
        </div>

        {/* Confirmation Modal */}
        {popup && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card p-5 rounded-xl border border-border max-w-sm w-full shadow-2xl text-left">
              <h3 className="text-sm font-bold mb-1.5 text-foreground">{popup.title}</h3>
              {popup.description && (
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{popup.description}</p>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closePopup}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    popup.action();
                    closePopup();
                  }}
                  className="text-xs font-bold"
                >
                  Confirm Action
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Regular Employee User View (Individual queue tracking)
  const hasActiveRequest = queueData && !queueData.message;
  const currentQueue = queueData?.queue || [];

  return (
    <div className="bg-card rounded-xl shadow-lg p-6 border border-border transition-colors duration-300 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5 gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-lg shrink-0">
            <UserCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground leading-tight">Queue Status</h2>
            <p className="text-muted-foreground text-[11px] mt-0.5">Live break turn indicators</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={refreshData}
          disabled={isRefreshing}
          className="w-8 h-8 shrink-0 rounded-lg"
          aria-label="Refresh view"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12 my-auto">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-4 text-destructive text-xs font-semibold my-auto">
          Failed to load telemetry pipeline
        </div>
      ) : (
        <div className="space-y-5">
          {/* Active Status Display Indicator */}
          {hasActiveRequest ? (
            <div className="text-center bg-muted/20 p-4 rounded-xl border border-border">
              <div className="inline-flex items-center justify-center relative mb-3">
                <div className="absolute w-24 h-24 bg-primary/10 rounded-full animate-ping"></div>
                <div className="text-4xl font-extrabold text-primary font-mono">
                  {queueData?.position || '--'}
                </div>
              </div>
              <p className="text-foreground text-xs font-bold flex items-center justify-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Your Live Queue Rank</span>
              </p>
              {queueData.estimatedWaitMinutes && (
                <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                  Estimated buffer: ~{queueData.estimatedWaitMinutes} min
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4 px-3 text-muted-foreground bg-muted/20 rounded-xl border border-border text-xs flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>No break application activated</span>
            </div>
          )}

          {/* Aggregate Queue Roster */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <ListOrdered className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-bold text-foreground">Aggregate Active Queue ({currentQueue.length})</h3>
            </div>

            {currentQueue.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {currentQueue.map((item: any, index: number) => (
                  <div
                    key={item.userId || index}
                    className={`p-2.5 rounded-lg border transition-colors text-xs ${
                      item.userId === user?.id
                        ? 'bg-primary/10 border-primary/40 font-semibold'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <p className="text-foreground line-clamp-1">{item.userName}</p>
                        {item.userId === user?.id && (
                          <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold uppercase">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            item.status === 'approved'
                              ? 'bg-green-500/10 text-green-500'
                              : item.status === 'rejected'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          {item.status || 'pending'}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          #{item.position}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 text-muted-foreground text-[11px]">
                Pipeline currently unoccupied
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto pt-4 text-[10px] text-muted-foreground text-center font-mono">
        Synced: {lastUpdated}
      </div>
    </div>
  );
};

export default QueueStatus;