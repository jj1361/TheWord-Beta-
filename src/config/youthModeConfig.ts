// Youth Mode Configuration
// Maps English words to image filenames
// Images should be placed in public/images/youth/
// Inline images (small, in-text) go in public/images/youth/
// Display images (large, for right panel) go in public/images/youth/display/

// Default image size settings (in em units for inline images)
export const DEFAULT_IMAGE_SIZE = {
  height: '4em',      // Default height for inline images
  maxWidth: '8em',    // Default max width for inline images
};

export interface WordImageMapping {
  word: string;           // The word to replace (case-insensitive)
  image: string;          // Image filename in public/images/youth/ (inline, small)
  displayImage?: string;  // Image filename in public/images/youth/display/ (large, for panel)
  alt: string;            // Alt text for accessibility
  tooltip?: string;       // Optional tooltip text
  description?: string;   // Extended description shown in the display panel
  imageSize?: {           // Optional custom size for this specific image
    height?: string;      // Custom height (e.g., '4em', '50px')
    maxWidth?: string;    // Custom max width (e.g., '10em', '100px')
  };
}

export const youthModeConfig: WordImageMapping[] = [
  // Example mappings - add more as needed
    { word: 'blood', image: 'blood.png', displayImage: 'blood-display.png', alt: 'Blood', tooltip: 'Blood - the life of the body', description: 'The life of the body.' },
  { word: 'curse', image: 'curse.png', displayImage: 'curse-display.png', alt: 'Curse', tooltip: 'Curse - to speak evil against', description: 'A curse is when someone speaks evil or harm against another person. In the Bible, curses were taken very seriously as words were believed to have power.' },
  { word: 'cursed', image: 'curse.png', displayImage: 'curse-display.png', alt: 'Cursed', tooltip: 'Cursed - having evil spoken against', description: 'To be cursed means to have evil spoken against you. It is the opposite of being blessed.' },
  { word: 'bless', image: 'bless.png', displayImage: 'bless-display.png', alt: 'Bless', tooltip: 'Bless - to speak good upon', description: 'To bless someone is to speak good things over them and wish them well. God blesses His people with love and protection.' },
  { word: 'blessed', image: 'bless.png', displayImage: 'bless-display.png', alt: 'Blessed', tooltip: 'Blessed - having good spoken upon', description: 'Being blessed means having good things spoken over you by God or others. It brings happiness and favor.' },
  { word: 'blessing', image: 'bless.png', displayImage: 'bless-display.png', alt: 'Blessing', tooltip: 'Blessing - good spoken upon someone', description: 'A blessing is a gift of good things from God. It can be protection, provision, or prosperity.' },
  { word: 'love', image: 'love.png', displayImage: 'love-display.png', alt: 'Love', tooltip: 'Love - deep affection and care', description: 'Love is the greatest gift. God is love, and He teaches us to love one another as He loves us.' },
  { word: 'loved', image: 'love.png', displayImage: 'love-display.png', alt: 'Loved', tooltip: 'Loved - shown deep affection', description: 'To be loved means someone cares deeply for you. God loves every person unconditionally.' },
  { word: 'faith', image: 'faith.png', displayImage: 'faith-display.png', alt: 'Faith', tooltip: 'Faith - trust and belief', description: 'Faith is believing and trusting in God even when we cannot see Him. It is the foundation of our relationship with God.' },
  { word: 'faithful', image: 'faith.png', displayImage: 'faith-display.png', alt: 'Faithful', tooltip: 'Faithful - full of trust and belief', description: 'Being faithful means staying true and loyal. God is always faithful to His promises.' },
  { word: 'pray', image: 'pray.png', displayImage: 'pray-display.png', alt: 'Pray', tooltip: 'Pray - to talk to God', description: 'Prayer is talking to God. We can pray anytime, anywhere, and about anything. God always listens.' },
  { word: 'prayer', image: 'pray.png', displayImage: 'pray-display.png', alt: 'Prayer', tooltip: 'Prayer - talking to God', description: 'Prayer is our conversation with God. Through prayer, we can thank God, ask for help, and share our hearts.' },
  { word: 'prayed', image: 'pray.png', displayImage: 'pray-display.png', alt: 'Prayed', tooltip: 'Prayed - talked to God', description: 'When someone prayed, they talked to God. Jesus often prayed to His Father in heaven.' },
  { word: 'heaven', image: 'heaven.png', displayImage: 'heaven-display.png', alt: 'Heaven', tooltip: 'Heaven - God\'s dwelling place', description: 'Heaven is where God lives. It is a perfect, beautiful place where there is no sadness or pain, and we will be with God forever.' },
  { word: 'heavenly', image: 'heaven.png', displayImage: 'heaven-display.png', alt: 'Heavenly', tooltip: 'Heavenly - of or from heaven', description: 'Heavenly means something that comes from heaven or is like heaven - pure, beautiful, and godly.' },
  { word: 'angel', image: 'angel.png', displayImage: 'angel-display.png', alt: 'Angel', tooltip: 'Angel - messenger of God', description: 'Angels are special beings created by God to serve Him and help people. They deliver messages and protect God\'s people.' },
  { word: 'angels', image: 'angel.png', displayImage: 'angel-display.png', alt: 'Angels', tooltip: 'Angels - messengers of God', description: 'Angels are God\'s heavenly helpers. They worship God and carry out His will on earth.' },
  { word: 'sin', image: 'sin.png', displayImage: 'sin-display.png', alt: 'Sin', tooltip: 'Sin - missing the mark, doing wrong', description: 'Sin is when we do something wrong or disobey Yah.  Elohim offers forgiveness through Yahusha.' },
  { word: 'sins', image: 'sin.png', displayImage: 'sin-display.png', alt: 'Sins', tooltip: 'Sins - wrongdoings', description: 'Sins are the wrong things we do. But God loves us and sent Jesus so our sins can be forgiven.' },
  { word: 'sinned', image: 'sin.png', displayImage: 'sin-display.png', alt: 'Sinned', tooltip: 'Sinned - did wrong', description: 'When someone sinned, they did something wrong against God. But God is merciful and ready to forgive.' },
  { word: 'forgive', image: 'forgive.png', displayImage: 'forgive-display.png', alt: 'Forgive', tooltip: 'Forgive - to pardon, let go of offense', description: 'To forgive is to let go of anger and not hold someone\'s mistakes against them. God forgives us and asks us to forgive others.' },
  { word: 'forgiven', image: 'forgive.png', displayImage: 'forgive-display.png', alt: 'Forgiven', tooltip: 'Forgiven - pardoned', description: 'Being forgiven means your sins are washed away. God remembers them no more when we ask for forgiveness.' },
  { word: 'forgiveness', image: 'forgive.png', displayImage: 'forgive-display.png', alt: 'Forgiveness', tooltip: 'Forgiveness - the act of pardoning', description: 'Forgiveness is God\'s gift to us. When we forgive others, we show God\'s love.' },
  { word: 'heart', image: 'heart.png', displayImage: 'heart-display.png', alt: 'Heart', tooltip: 'Heart - the inner self, emotions', description: 'In the Bible, the heart represents our innermost being - our thoughts, feelings, and desires. God looks at our hearts.' },
  { word: 'hearts', image: 'heart.png', displayImage: 'heart-display.png', alt: 'Hearts', tooltip: 'Hearts - inner selves', description: 'Our hearts are where we make decisions and feel emotions. God wants us to have pure hearts.' },
  { word: 'light', image: 'light.png', displayImage: 'light-display.png', alt: 'Light', tooltip: 'Light - illumination, truth', description: 'Light represents God, truth, and goodness. Jesus said, "I am the light of the world." We are called to be lights too.' },
  { word: 'darkness', image: 'darkness.png', displayImage: 'darkness-display.png', alt: 'Darkness', tooltip: 'Darkness - absence of light', description: 'Darkness represents evil, sin, and being away from God. But God\'s light overcomes all darkness.' },
  { word: 'dark', image: 'darkness.png', displayImage: 'darkness-display.png', alt: 'Dark', tooltip: 'Dark - without light', description: 'Dark times are difficult times. But God is with us even in the darkest moments.' },
  { word: 'king', image: 'king.png', displayImage: 'king-display.png', alt: 'King', tooltip: 'King - ruler, sovereign', description: 'A king is a ruler with authority. God is the King of kings, the ultimate ruler over everything.' },
  { word: 'kingdom', image: 'kingdom.png', displayImage: 'kingdom-display.png', alt: 'Kingdom', tooltip: 'Kingdom - realm of a king', description: 'God\'s Kingdom is His rule and reign. Jesus taught us to pray "Your kingdom come" - for God\'s will to be done on earth.' },
  { word: 'shepherd', image: 'shepherd.png', displayImage: 'shepherd-display.png', alt: 'Shepherd', tooltip: 'Shepherd - one who cares for sheep', description: 'A shepherd cares for and protects sheep. Jesus calls Himself the Good Shepherd who lays down His life for His sheep.' },
  { word: 'lamb', image: 'lamb.png', displayImage: 'lamb-display.png', alt: 'Lamb', tooltip: 'Lamb - young sheep, symbol of innocence', description: 'A lamb is a young sheep. Jesus is called the Lamb of God because He was sacrificed for our sins, pure and innocent.' },
  { word: 'cross', image: 'cross.png', displayImage: 'cross-display.png', alt: 'Cross', tooltip: 'Cross - symbol of sacrifice', description: 'The cross is where Jesus died for our sins. It reminds us of God\'s incredible love and the price paid for our salvation.' },
  { word: 'water', image: 'water.png', displayImage: 'water-display.png', alt: 'Water', tooltip: 'Water - symbol of life and cleansing', description: 'Water represents life, cleansing, and the Holy Spirit. Jesus offers living water that satisfies our souls forever.' },
  { word: 'fire', image: 'fire.png', displayImage: 'fire-display.png', alt: 'Fire', tooltip: 'Fire - symbol of purification', description: 'Fire represents God\'s presence, power, and purification. The Holy Spirit came as tongues of fire at Pentecost.' },
  { word: 'bread', image: 'bread.png', displayImage: 'bread-display.png', alt: 'Bread', tooltip: 'Bread - symbol of sustenance', description: 'Bread represents life and sustenance. Jesus said, "I am the bread of life" - He gives us spiritual nourishment.' },
  { word: 'wine', image: 'wine.png', displayImage: 'wine-display.png', alt: 'Wine', tooltip: 'Wine - symbol of joy and covenant', description: 'Wine represents joy and celebration. In communion, it reminds us of Jesus\' blood shed for us.' },
  { word: 'sword', image: 'sword.png', displayImage: 'sword-display.png', alt: 'Sword', tooltip: 'Sword - weapon, also symbol of God\'s word', description: 'The sword of the Spirit is the Word of God. It is powerful and can defeat evil when we use it.' },
  { word: 'peace', image: 'peace.png', displayImage: 'peace-display.png', alt: 'Peace', tooltip: 'Peace - tranquility, wholeness', description: 'Peace is more than quiet - it\'s wholeness and being right with God. Jesus gives us peace that the world cannot give.' },
  { word: 'joy', image: 'joy.png', displayImage: 'joy-display.png', alt: 'Joy', tooltip: 'Joy - deep gladness', description: 'Joy is a deep happiness that comes from God. It\'s not based on circumstances but on knowing God loves us.' },
  { word: 'hope', image: 'hope.png', displayImage: 'hope-display.png', alt: 'Hope', tooltip: 'Hope - confident expectation', description: 'Hope is confident expectation in God\'s promises. We have hope because God is faithful and His plans are good.' },
  { word: 'mercy', image: 'mercy.png', displayImage: 'mercy-display.png', alt: 'Mercy', tooltip: 'Mercy - compassion, not getting what we deserve', description: 'Mercy is not getting the punishment we deserve. God shows us mercy because of His great love.' },
  { word: 'grace', image: 'grace.png', displayImage: 'grace-display.png', alt: 'Grace', tooltip: 'Grace - unmerited favor', description: 'Grace is getting what we don\'t deserve - God\'s love and salvation as a free gift through Jesus.' },
  { word: 'glory', image: 'glory.png', displayImage: 'glory-display.png', alt: 'Glory', tooltip: 'Glory - honor, splendor, majesty', description: 'Glory is the magnificent splendor of God. When we see His glory, we see His beauty, power, and holiness.' },
  { word: 'truth', image: 'truth.png', displayImage: 'truth-display.png', alt: 'Truth', tooltip: 'Truth - what is real and right', description: 'Truth is what is real and right. Jesus said, "I am the way, the truth, and the life." God\'s Word is truth.' },
  { word: 'wisdom', image: 'wisdom.png', displayImage: 'wisdom-display.png', alt: 'Wisdom', tooltip: 'Wisdom - applying knowledge rightly', description: 'Wisdom is knowing what is right and doing it. It comes from God, and we can ask Him for it.' },
  { word: 'spirit', image: 'spirit.png', displayImage: 'spirit-display.png', alt: 'Spirit', tooltip: 'Spirit - the immaterial part of a person', description: 'The spirit is the part of us that connects with God. The Holy Spirit lives in believers and guides us.' },
  { word: 'soul', image: 'soul.png', displayImage: 'soul-display.png', alt: 'Soul', tooltip: 'Soul - the inner being', description: 'The soul is our inner being - our mind, will, and emotions. God cares for our souls and wants us to thrive.' },
  { word: 'devil', image: 'devil.png', displayImage: 'devil-display.png', alt: 'Devil', tooltip: 'Devil - the adversary, enemy of God', description: 'The devil is God\'s enemy who tries to deceive us. But Jesus has already defeated him, and we can resist him.' },
  { word: 'satan', image: 'devil.png', displayImage: 'devil-display.png', alt: 'Satan', tooltip: 'Satan - the accuser', description: 'Satan means "accuser." He tries to make us feel guilty, but Jesus defends us and has paid for our sins.' },
  { word: 'temple', image: 'temple.png', displayImage: 'temple-display.png', alt: 'Temple', tooltip: 'Temple - house of worship', description: 'The temple was God\'s house where people worshiped. Now, believers are the temple of the Holy Spirit.' },
  { word: 'altar', image: 'altar.png', displayImage: 'altar-display.png', alt: 'Altar', tooltip: 'Altar - place of sacrifice', description: 'An altar is a place of sacrifice and worship. People brought offerings to God at the altar.' },
  { word: 'covenant', image: 'covenant.png', displayImage: 'covenant-display.png', alt: 'Covenant', tooltip: 'Covenant - binding agreement', description: 'A covenant is a solemn promise. God made covenants with His people, and the new covenant is through Jesus.' },
  { word: 'prophet', image: 'prophet.png', displayImage: 'prophet-display.png', alt: 'Prophet', tooltip: 'Prophet - one who speaks for God', description: 'A prophet is someone who speaks God\'s messages to people. Prophets called people back to God.' },
  { word: 'prophets', image: 'prophet.png', displayImage: 'prophet-display.png', alt: 'Prophets', tooltip: 'Prophets - those who speak for God', description: 'The prophets were men and women chosen by God to deliver His messages and point people to Him.' },
];

// Create a lookup map for efficient word matching
export const wordImageMap = new Map<string, WordImageMapping>();
youthModeConfig.forEach(mapping => {
  wordImageMap.set(mapping.word.toLowerCase(), mapping);
});

// Function to check if a word has an image mapping
export const getWordImage = (word: string): WordImageMapping | undefined => {
  // Remove punctuation and convert to lowercase for matching
  const cleanWord = word.replace(/[.,;:!?'"()\[\]{}]/g, '').toLowerCase();
  return wordImageMap.get(cleanWord);
};

// Get the inline image path
export const getImagePath = (imageName: string): string => {
  return `/images/youth/${imageName}`;
};

// Get the display image path (for right panel)
export const getDisplayImagePath = (imageName: string): string => {
  return `/images/youth/display/${imageName}`;
};

// Get the image size for a word mapping (uses custom size or falls back to default)
export const getImageSize = (mapping: WordImageMapping): { height: string; maxWidth: string } => {
  return {
    height: mapping.imageSize?.height || DEFAULT_IMAGE_SIZE.height,
    maxWidth: mapping.imageSize?.maxWidth || DEFAULT_IMAGE_SIZE.maxWidth,
  };
};
