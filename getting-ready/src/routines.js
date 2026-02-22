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
    '🦷': 'floss',
    '🪮': 'brush-hair',
    '🎒': 'backpack',
};

export function getRoutine() {
    const morning = new Date().getHours() < 12;
    if (morning) {
        const emojis = ['🚽', '👕', '🧺', '🛏️', '🪥', '🧹'];
        const labels = ['Toilet', 'Get Dressed', 'Dirty Clothes in Basket', 'Make Bed', 'Brush Teeth', 'Tidy Bedroom'];
        return [
            { leftEmojis: emojis, leftLabels: labels, rightEmojis: emojis, rightLabels: labels, timeLimit: 20 * 60 },
        ];
    }
    const thursday = new Date().getDay() === 4;
    const phase1Emojis = ['🩳', '🧺', '👕', '🎒'];
    const phase1Labels = [
        'Pyjamas',
        'Dirty Clothes in Basket',
        'Clothes for Tomorrow',
        thursday ? 'Get Stuff Ready for Golden Time & Clubs' : 'Get Ready for Clubs'
    ];
    return [
        {
            leftEmojis: phase1Emojis, leftLabels: phase1Labels,
            rightEmojis: phase1Emojis, rightLabels: phase1Labels,
            timeLimit: 10 * 60,
        },
        {
            leftEmojis:  ['🚽', '🪥', '🦷', '🚰'],
            leftLabels:  ['Toilet', 'Brush Teeth', 'Floss', 'Water Bottle'],
            rightEmojis: ['🚽', '🪥', '🪮', '🚰'],
            rightLabels: ['Toilet', 'Brush Teeth', 'Brush Hair', 'Water Bottle'],
            timeLimit: 15 * 60,
        },
    ];
}

export function emojiImageUrl(emoji) {
    return `${import.meta.env.BASE_URL}images/${emojiImages[emoji]}.png`;
}
