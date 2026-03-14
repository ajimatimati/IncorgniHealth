import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const HolographicHuman = () => {
  const groupRef = useRef();

  // Slow ambient rotation for showcase
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  // Material: Glowing Cyan Wireframe
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    wireframe: true,
    transparent: true,
    opacity: 0.3,
  });

  // Solid Core Material
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0x011e3b,
    transparent: true,
    opacity: 0.8,
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      
      {/* --- HEAD --- */}
      <group position={[0, 3.8, 0]}>
        <mesh material={coreMaterial}>
          <sphereGeometry args={[0.6, 16, 16]} />
        </mesh>
        <mesh material={wireframeMaterial}>
          <sphereGeometry args={[0.62, 12, 12]} />
        </mesh>
      </group>

      {/* --- NECK --- */}
      <group position={[0, 3.0, 0]}>
        <mesh material={coreMaterial}>
          <cylinderGeometry args={[0.2, 0.3, 0.6, 8]} />
        </mesh>
        <mesh material={wireframeMaterial}>
          <cylinderGeometry args={[0.22, 0.32, 0.6, 8]} />
        </mesh>
      </group>

      {/* --- UPPER TORSO --- */}
      <group position={[0, 1.8, 0]}>
        <mesh material={coreMaterial}>
          <cylinderGeometry args={[1.2, 1.0, 2.0, 16]} />
        </mesh>
        <mesh material={wireframeMaterial}>
          <cylinderGeometry args={[1.25, 1.05, 2.05, 12]} />
        </mesh>
        
        {/* Floating HTML Tag attached directly to the Chest */}
        <Html position={[1.5, 0.5, 1]} center distanceFactor={10}>
          <div className="flex items-center gap-2 group cursor-pointer pointer-events-auto">
             <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center shadow-neon-orange animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
             </div>
             <div className="whitespace-nowrap opacity-75 group-hover:opacity-100 transition-opacity glass-panel px-2 py-1 rounded text-[10px] text-orange-400 font-bold tracking-widest border border-orange-500/30 bg-black/50">
               ELEVATED CORTISOL
             </div>
          </div>
        </Html>

        {/* Respiratory Link */}
        <Html position={[-1.2, -0.5, 1]} center distanceFactor={10}>
           <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center shadow-neon-blue">
              <div className="w-1 h-1 rounded-full bg-blue-400" />
           </div>
        </Html>
      </group>

      {/* --- LOWER TORSO --- */}
      <group position={[0, 0.2, 0]}>
        <mesh material={coreMaterial}>
          <cylinderGeometry args={[1.0, 1.1, 1.5, 16]} />
        </mesh>
        <mesh material={wireframeMaterial}>
          <cylinderGeometry args={[1.05, 1.15, 1.55, 12]} />
        </mesh>
      </group>

      {/* --- LEFT ARM (Viewer Right) --- */}
      <group position={[1.6, 1.5, 0]} rotation={[0, 0, 0.2]}>
        {/* Shoulder */}
        <mesh material={wireframeMaterial} position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.4, 8, 8]} />
        </mesh>
        {/* Upper Arm */}
        <mesh material={coreMaterial} position={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.25, 1.8, 8]} />
        </mesh>
        <mesh material={wireframeMaterial} position={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.27, 1.8, 8]} />
        </mesh>
      </group>

      {/* --- RIGHT ARM (Viewer Left) --- */}
      <group position={[-1.6, 1.5, 0]} rotation={[0, 0, -0.2]}>
        {/* Shoulder */}
        <mesh material={wireframeMaterial} position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.4, 8, 8]} />
        </mesh>
        {/* Upper Arm */}
        <mesh material={coreMaterial} position={[-0.2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.25, 1.8, 8]} />
        </mesh>
        <mesh material={wireframeMaterial} position={[-0.2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.27, 1.8, 8]} />
        </mesh>
      </group>

      {/* --- LEFT LEG --- */}
      <group position={[0.6, -1.8, 0]}>
        {/* High Thigh */}
        <mesh material={coreMaterial}>
          <cylinderGeometry args={[0.45, 0.35, 2.5, 12]} />
        </mesh>
        <mesh material={wireframeMaterial}>
          <cylinderGeometry args={[0.47, 0.37, 2.5, 8]} />
        </mesh>
      </group>

      {/* --- RIGHT LEG --- */}
      <group position={[-0.6, -1.8, 0]}>
        {/* High Thigh */}
        <mesh material={coreMaterial}>
          <cylinderGeometry args={[0.45, 0.35, 2.5, 12]} />
        </mesh>
        <mesh material={wireframeMaterial}>
          <cylinderGeometry args={[0.47, 0.37, 2.5, 8]} />
        </mesh>
      </group>

      {/* Grid Floor */}
      <gridHelper args={[10, 20, 0x1e3a8a, 0x0f172a]} position={[0, -3.1, 0]} />

    </group>
  );
};

export default HolographicHuman;
