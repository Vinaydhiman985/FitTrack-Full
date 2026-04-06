import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as FileSystem from 'expo-file-system';

/**
 * Lightweight GLB previewer for shop modal.
 * - Streams remote GLB via FileSystem to avoid CORS headaches.
 * - Adds ambient + directional light and slow auto-rotate.
 * - Keeps poly budget safe for mobile; assumes baked textures.
 */
export default function Avatar3DViewer({ modelUrl, background = '#0B1220' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cleanupRef = useRef(() => {});

  useEffect(() => () => cleanupRef.current(), []);

  const onContextCreate = async (gl) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const renderer = new Renderer({ gl, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(new THREE.Color(background));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 1.1, 2.2);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(2, 3, 2);
    scene.add(dir);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 32),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 1, metalness: 0 })
    );
    floor.rotateX(-Math.PI / 2);
    floor.position.y = -0.6;
    scene.add(floor);

    let mixer;
    let model;

    try {
      // Download to file first to avoid cross-origin image issues in GLTFLoader.
      const file = `${FileSystem.cacheDirectory}avatar.glb`;
      const result = await FileSystem.downloadAsync(modelUrl, file);

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(result.uri);
      model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) child.castShadow = true;
      });
      model.position.set(0, -0.6, 0);
      model.scale.set(1.2, 1.2, 1.2);
      scene.add(model);

      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
      }

      setLoading(false);
    } catch (e) {
      console.warn('3D load failed', e);
      setError('3D preview unavailable on this device.');
      setLoading(false);
    }

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      if (model) model.rotation.y += 0.4 * delta;
      renderer.render(scene, camera);
      gl.endFrameEXP();
      frameId = requestAnimationFrame(animate);
    };
    animate();

    cleanupRef.current = () => {
      if (frameId) cancelAnimationFrame(frameId);
      renderer.dispose();
      scene.clear();
    };
  };

  return (
    <View style={styles.wrap}>
      {loading && !error && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#F59E0B" />
          <Text style={styles.loadingText}>Loading 3D…</Text>
        </View>
      )}
      {error && (
        <View style={styles.overlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <GLView style={styles.gl} onContextCreate={onContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', height: 360, borderRadius: 16, overflow: 'hidden', backgroundColor: '#0B1220' },
  gl: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(11,18,32,0.6)',
  },
  loadingText: { marginTop: 8, color: '#E5E7EB', fontWeight: '700' },
  errorText: { color: '#F87171', fontWeight: '800', textAlign: 'center', paddingHorizontal: 16 },
});
