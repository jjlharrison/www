export const emojiImages = {
    '👕': 'tshirt',
    '🚰': 'water',
    '🚽': 'toilet',
    '🛏️': 'bed',
    '🪥': 'toothbrush',
    '🧹': 'broom',
    '🧺': 'basket',
    '🩳': 'pyjamas',
    '✅': 'check-mark',
    '🐝': 'bee',
};

export function getRoutine() {
    const morning = new Date().getHours() < 12;
    const emojis = morning
        ? ['🚽', '👕', '🧺', '🛏️', '🪥', '🧹']
        : ['🚽', '🩳', '🧺', '🪥', '🚰', '👕'];
    const labels = morning
        ? ['Toilet', 'Get Dressed', 'Dirty Clothes in Basket', 'Make Bed', 'Brush Teeth', 'Tidy Bedroom']
        : ['Toilet', 'Pyjamas', 'Dirty Clothes in Basket', 'Brush Teeth', 'Water Bottle', 'Clothes for Tomorrow'];
    return { emojis, labels };
}

export function emojiImageUrl(emoji) {
    return `/images/${emojiImages[emoji]}.png`;
}
