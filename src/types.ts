export interface ItineraryItem {
    id: string;
    time: string;
    title: string;
    type: 'food' | 'stay' | 'move' | 'play';
    description: string;
    location?: string;
    lat?: number;
    lng?: number;
    timezone?: 'Asia/Taipei' | 'Asia/Tokyo';
    relatedLinks?: {
        title: string;
        url: string;
    }[];
}

export interface WishlistItem {
    id: string;
    name: string;
    votes: number;
    createdBy?: string;
    creatorName?: string;
    votedBy?: string[];
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: number;
}

export type Tab = 'itinerary' | 'wishlist' | 'map' | 'assistant';
