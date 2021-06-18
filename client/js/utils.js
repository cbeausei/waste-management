export function generateNick() {
    const adjectives = [
      // Emotion, personality & feelings.
      'Adventurous',
      'Affectionate',
      'Agreeable',
      'Ambitious',
      'Bright',
      'Charming',
      'Compassionate',
      'Considerate',
      'Courageous',
      'Courteous',
      'Diligent',
      'Enthusiastic',
      'Generous',
      'Happy',
      'Helpful',
      'Inventive',
      'Likable',
      'Loyal',
      'Passionate',
      'Reliable',
      'Resourceful',
      'Sensible',
      'Sincere',
      'Sympathetic',
      'Trustworthy',
      'Witty',
      // Good.
      'Amazing',
      'Awesome',
      'Excellent',
      'Fabulous',
      'Fantastic',
      'Incredible',
      'Outstanding',
      'Splendid',
      'Super',
      'Wonderful',
      // Positive appearance.
      'Adorable',
      'Attractive',
      'Beautiful',
      'Clean',
      'Colorful',
      'Cute',
      'Elegant',
      'Fit',
      'Gorgeous',
      'Sleek',
    ];

    const names = [
      'Angel',
      'Baby',
      'Bambi',
      'Cuddles',
      'Daisy',
      'Diamond',
      'Flower',
      'Fluffy',
      'Lola',
      'Love',
      'Princess',
      'Tutu',
      'Tweety',
      'Panda',
      'Chocolate',
      'Cocoa',
      'Mocha',
      'Moony',
      'Mystery',
      'Ghost',
      'Moon',
      'Sun',
      'Sunshine',
      'Bear',
      'Mouse',
      'Squirt',
      'Little Bear',
      'Puffy',
      'Sparkle',
      'Sprinkle',
      'Polka',
      'Confetti',
      'Peach',
      'Maple',
      'Honey',
      'Evee',
    ];

    const adjective = adjectives[
        Math.floor(Math.random() * adjectives.length)];
    const name = names[
        Math.floor(Math.random() * names.length)];
    return adjective + ' ' + name;
  }