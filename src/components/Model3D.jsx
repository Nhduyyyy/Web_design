import { Suspense } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useLoader } from '@react-three/fiber'
import { useRef } from 'react'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import * as THREE from 'three'

/**
 * Component để load và hiển thị file 3D (GLB/GLTF/STL)
 * Sử dụng: <Model3D modelPath="/models/masks/mask-quan-van.glb" />
 */
function Model3D({ 
  modelPath, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0],
  scale = 1,
  autoRotate = false,
  animationSpeed = 1,
  onClick,
  onPointerOver,
  onPointerOut,
  color = null, // Optional color override for STL
  metalness = 0.3 // Optional metalness for STL
}) {
  const groupRef = useRef()
  const isSTL = modelPath.toLowerCase().endsWith('.stl')
  
  // Load STL files
  const stlGeometry = isSTL ? useLoader(STLLoader, modelPath) : null
  
  // Load GLB/GLTF files
  const gltfData = !isSTL ? useGLTF(modelPath) : null
  const scene = gltfData?.scene

  // Auto rotation animation
  useFrame((state) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += 0.01 * animationSpeed
    }
  })

  // Normalize scale to array format
  const scaleArray = Array.isArray(scale) ? scale : [scale, scale, scale]

  // Render STL file
  if (isSTL && stlGeometry) {
    // Compute bounding box và center model
    stlGeometry.computeBoundingBox()
    stlGeometry.computeVertexNormals()
    const center = new THREE.Vector3()
    stlGeometry.boundingBox.getCenter(center)
    stlGeometry.translate(-center.x, -center.y, -center.z)

    return (
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        scale={scaleArray}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <mesh geometry={stlGeometry}>
          <meshStandardMaterial 
            color={color || '#cccccc'} 
            metalness={metalness} 
            roughness={0.7}
          />
        </mesh>
      </group>
    )
  }

  // Render GLB/GLTF file
  if (scene) {
    // Clone scene để tránh conflict khi dùng nhiều instance
    const clonedScene = scene.clone()

    return (
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        scale={scaleArray}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <primitive object={clonedScene} />
      </group>
    )
  }

  return null
}

/**
 * Wrapper component với Suspense để load model
 */
export function Model3DLoader({ 
  modelPath, 
  fallback = null,
  ...props 
}) {
  if (!modelPath) {
    return fallback
  }

  return (
    <Suspense fallback={fallback || <LoadingModel />}>
      <Model3D modelPath={modelPath} {...props} />
    </Suspense>
  )
}

// Loading indicator khi đang load model
function LoadingModel() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#cccccc" wireframe />
    </mesh>
  )
}

// Preload models (optional - để tăng performance)
export function preloadModel(modelPath) {
  useGLTF.preload(modelPath)
}

export default Model3D

