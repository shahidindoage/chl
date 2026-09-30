import { io, type Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";

import type { CommentaryDto, LiveStatusDto } from "@tournament/shared";
import type { MatchEventDto } from "@tournament/shared";

import { API_BASE_URL, getToken } from "../api/client.js";

const socketUrl = API_BASE_URL.replace(/\/api$/, "");
let shared: Socket | null = null;

function getSocket(): Socket {
  if (!shared) {
    shared = io(socketUrl, {
      auth: { token: getToken() ?? undefined },
      transports: ["websocket", "polling"],
    });
  }
  return shared;
}

/**
 * Live match hook (Section 3 sockets/): subscribes to room match:{id},
 * keeps status/score/events/commentary in state via socket pushes only.
 * Initial state comes from the REST feed, so reconnects never go stale.
 */
export interface LiveMatchState {
  status: LiveStatusDto | null;
  events: MatchEventDto[];
  commentary: CommentaryDto[];
  connected: boolean;
}

export function useLiveMatch(matchId: string | undefined, initial: LiveMatchState["status"] | null): LiveMatchState {
  const [state, setState] = useState<LiveMatchState>({
    status: initial,
    events: [],
    commentary: [],
    connected: false,
  });
  const statusRef = useRef(initial);

  useEffect(() => {
    if (!matchId) return;
    const socket = getSocket();

    const onStatus = (p: { status: LiveStatusDto["status"]; isPaused: boolean; currentMinute: number | null; currentPeriod: string | null; teamAScore: number; teamBScore: number }) => {
      statusRef.current = {
        matchId,
        serverTime: new Date().toISOString(),
        ...p,
      };
      setState((s) => ({ ...s, status: statusRef.current }));
    };
    const onScore = (p: LiveStatusDto) => setState((s) => ({ ...s, status: p }));
    const onEvent = (e: MatchEventDto) => setState((s) => ({ ...s, events: [...s.events, e] }));
    const onCommentary = (c: CommentaryDto) => setState((s) => ({ ...s, commentary: [c, ...s.commentary] }));
    const onDeleted = (p: { id: string }) => setState((s) => ({ ...s, commentary: s.commentary.filter((c) => c.id !== p.id) }));
    const onConnect = () => setState((s) => ({ ...s, connected: true }));
    const onDisconnect = () => setState((s) => ({ ...s, connected: false }));

    socket.emit("match:subscribe", matchId);
    socket.on("match:status", onStatus);
    socket.on("match:score", onScore);
    socket.on("match:event", onEvent);
    socket.on("commentary:new", onCommentary);
    socket.on("commentary:deleted", onDeleted);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.emit("match:unsubscribe", matchId);
      socket.off("match:status", onStatus);
      socket.off("match:score", onScore);
      socket.off("match:event", onEvent);
      socket.off("commentary:new", onCommentary);
      socket.off("commentary:deleted", onDeleted);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [matchId]);

  return state;
}
