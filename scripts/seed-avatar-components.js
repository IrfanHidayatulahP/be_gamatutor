require('dotenv').config();
const { sequelize, AvatarComponent } = require('../src/models');

const avatarComponents = [
  // Head (optional category - but let's include for completeness)
  { category: 'head', name: 'Default Head', assetPath: '/assets/avatar/head/default.png' },

  // Hair components
  { category: 'hair', name: 'Short Hair', assetPath: '/assets/avatar/hair/short.png' },
  { category: 'hair', name: 'Long Hair', assetPath: '/assets/avatar/hair/long.png' },
  { category: 'hair', name: 'Curly Hair', assetPath: '/assets/avatar/hair/curly.png' },
  { category: 'hair', name: 'Bald', assetPath: '/assets/avatar/hair/bald.png' },
  { category: 'hair', name: 'Ponytail', assetPath: '/assets/avatar/hair/ponytail.png' },

  // Face components
  { category: 'face', name: 'Smile', assetPath: '/assets/avatar/face/smile.png' },
  { category: 'face', name: 'Serious', assetPath: '/assets/avatar/face/serious.png' },
  { category: 'face', name: 'Wink', assetPath: '/assets/avatar/face/wink.png' },
  { category: 'face', name: 'Glasses', assetPath: '/assets/avatar/face/glasses.png' },
  { category: 'face', name: 'Blush', assetPath: '/assets/avatar/face/blush.png' },

  // Shirt components
  { category: 'shirt', name: 'T-Shirt', assetPath: '/assets/avatar/shirt/tshirt.png' },
  { category: 'shirt', name: 'Hoodie', assetPath: '/assets/avatar/shirt/hoodie.png' },
  { category: 'shirt', name: 'Formal Shirt', assetPath: '/assets/avatar/shirt/formal.png' },
  { category: 'shirt', name: 'Tank Top', assetPath: '/assets/avatar/shirt/tanktop.png' },

  // Pants components
  { category: 'pants', name: 'Jeans', assetPath: '/assets/avatar/pants/jeans.png' },
  { category: 'pants', name: 'Shorts', assetPath: '/assets/avatar/pants/shorts.png' },
  { category: 'pants', name: 'Sweatpants', assetPath: '/assets/avatar/pants/sweatpants.png' },
  { category: 'pants', name: 'Formal Pants', assetPath: '/assets/avatar/pants/formal.png' },

  // Special components
  { category: 'special', name: 'Cape', assetPath: '/assets/avatar/special/cape.png' },
  { category: 'special', name: 'Wings', assetPath: '/assets/avatar/special/wings.png' },
  { category: 'special', name: 'Halo', assetPath: '/assets/avatar/special/halo.png' },
  { category: 'special', name: 'Backpack', assetPath: '/assets/avatar/special/backpack.png' },
];

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync();
    console.log('Models synced');

    for (const component of avatarComponents) {
      const [created, exists] = await AvatarComponent.findOrCreate({
        where: {
          category: component.category,
          name: component.name
        },
        defaults: component
      });

      if (exists) {
        console.log(`✅ Created: ${component.category} - ${component.name} (ID: ${created.avaId})`);
      } else {
        console.log(`⏭️  Exists: ${component.category} - ${component.name} (ID: ${created.avaId})`);
      }
    }

    console.log('\n🎉 Avatar components seeding completed!');
    console.log(`Total: ${avatarComponents.length} components`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();