import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function AnatomicalModel(props) {
  const group   = useRef();
  const scanRef = useRef();

  const { scene } = useGLTF('/human_anatomy.glb');

  // Clean, medical-grade solid white/gray material. No glass, no holograms, no glow.
  const baseMat = useMemo(() => new THREE.MeshStandardMaterial({
    color:     0xf4f4f5,    // Zinc-100
    roughness: 0.8,         // Matte, non-glossy finish
    metalness: 0.1,
    side:      THREE.DoubleSide,
  }), []);

  // Apply clean material
  useLayoutEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow    = true;
      child.receiveShadow = true;
      child.material      = baseMat;
      
      // Remove any previously added inner glow meshes from the old dark theme
      if (child.userData.innerGlowAdded) {
        const parent = child.parent;
        const glowObjects = parent.children.filter(c => c.material && c.material.transparent);
        glowObjects.forEach(g => parent.remove(g));
        child.userData.innerGlowAdded = false;
      }
    });
  }, [scene, baseMat]);

  // Clinical scan-line sweep — subtle violet instead of neon blue
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (scanRef.current) {
      scanRef.current.position.y = Math.sin(t * 0.33) * 2.2;
      scanRef.current.material.opacity = 0.1 + 0.15 * (1 - Math.abs(Math.sin(t * 0.33)));
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      {/* The GLTF mesh */}
      <primitive
        object={scene}
        scale={1.8}
        position={[0, -1.8, 0]}
      />

      {/* Thin Violet Scan Line */}
      <mesh ref={scanRef} position={[0, 0, 0]}>
        <planeGeometry args={[3.5, 0.015]} />
        <meshBasicMaterial
          color={0x6d28d9} // Violet
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Clean Pedestal — minimal rings */}
      <mesh position={[0, -1.86, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.15, 1.4, 80]} />
        <meshBasicMaterial color={0xe4e4e7} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, -1.86, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.58, 80]} />
        <meshBasicMaterial color={0xe4e4e7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

useGLTF.preload('/human_anatomy.glb');
