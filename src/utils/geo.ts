/**
 * Extracts latitude and longitude from a Google Maps URL.
 * Supports standard /maps/place/, /maps/@, and generic formats.
 * 
 * @param url Google Maps URL string
 * @returns [lat, lng] or null if not found
 */
export const extractCoordinates = (url: string | undefined): [number, number] | null => {
    if (!url) return null;

    // Pattern 1: @lat,lng (Standard)
    // Supports: @26.2123,127.6789 or @26,127 etc.
    const atMatch = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch) {
        return [parseFloat(atMatch[1]), parseFloat(atMatch[2])];
    }

    // Pattern 2: q=lat,lng (Search Query)
    const qMatch = url.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (qMatch) {
        return [parseFloat(qMatch[1]), parseFloat(qMatch[2])];
    }

    // Pattern 3: ll=lat,lng (LatLong Param)
    const llMatch = url.match(/[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (llMatch) {
        return [parseFloat(llMatch[1]), parseFloat(llMatch[2])];
    }

    // Pattern 4: 3dlat!4dlng (New Stats Param)
    const dataMatch = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (dataMatch) {
        return [parseFloat(dataMatch[1]), parseFloat(dataMatch[2])];
    }

    return null;
};
