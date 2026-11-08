document.getElementById('app').textContent = 'OpenFreeyond';

// TEMPORARY (Task 7): show the place for a hand check. Task 8 or later replaces this.
import('./world/scene.js').then(({ mountWorld }) => {
  mountWorld(
    document.getElementById('app'),
    { hair: 'dark-blond', clothing: 'moss-green' },
    { stats: true },
  );
});
