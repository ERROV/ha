// SSE Notifier Utility
// This file handles the registry of active SSE connections and providing 
// broadcast functions that can be used safely across the application.

// Global registry to track SSE connections by userId
export const connections = new Map<string, Set<any>>();

/**
 * Broadcasts a notification to a specific user's active SSE connections
 */
export function broadcastToUser(userId: string, notification: any) {
    const userConnections = connections.get(userId);

    if (!userConnections || userConnections.size === 0) {
        console.log(`No active SSE connections for user: ${userId}`);
        return;
    }

    const message = JSON.stringify({
        type: "notification",
        data: notification,
    });

    userConnections.forEach((writer) => {
        try {
            writer.write(message);
        } catch (error) {
            console.error("Error broadcasting to user:", error);
            userConnections.delete(writer);
        }
    });

    console.log(`📤 Broadcasted notification to ${userConnections.size} connection(s) for user: ${userId}`);
}

/**
 * Broadcasts a notification to all connected users
 */
export function broadcastToAll(notification: any) {
    const message = JSON.stringify({
        type: "notification",
        data: notification,
    });

    let totalSent = 0;
    connections.forEach((userConnections, userId) => {
        userConnections.forEach((writer) => {
            try {
                writer.write(message);
                totalSent++;
            } catch (error) {
                console.error("Error broadcasting to all:", error);
                userConnections.delete(writer);
            }
        });
    });

    console.log(`📤 Broadcasted notification to ${totalSent} total connection(s)`);
}
