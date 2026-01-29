import { useState, Suspense, useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, Text } from '@react-three/drei'
import { motion } from 'framer-motion'
import { TextureLoader } from 'three'
import { maskData } from '../data/tuongData'
import { costumeData } from '../data/costumeData'
import { Model3DLoader } from './Model3D'
import './Viewer3D.css'

// Image Mask Component - Hiển thị ảnh mặt nạ thật trên plane 3D
function ImageMask3D({ mask, position, rotation }) {
  const groupRef = useRef()
  const texture = useLoader(TextureLoader, mask.imagePath)
  
  // Gentle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.1
      groupRef.current.rotation.y = (rotation[1] || 0) + Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  // Tính toán kích thước dựa trên tỷ lệ ảnh để không bị cắt
  const baseSize = 2.5
  let planeWidth = baseSize
  let planeHeight = baseSize
  
  if (texture && texture.image) {
    const textureAspect = texture.image.width / texture.image.height
    if (textureAspect > 1) {
      // Ảnh ngang
      planeWidth = baseSize * textureAspect
      planeHeight = baseSize
    } else {
      // Ảnh dọc
      planeWidth = baseSize
      planeHeight = baseSize / textureAspect
    }
  }

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Main mask plane - front */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshStandardMaterial 
          map={texture} 
          transparent 
          opacity={0.95}
          side={2} // DoubleSide
        />
      </mesh>
      
      {/* Back side - same image */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshStandardMaterial 
          map={texture} 
          transparent 
          opacity={0.95}
          side={2}
        />
      </mesh>
      
      {/* Glow effect - điều chỉnh theo kích thước thực tế */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[planeWidth * 1.1, planeHeight * 1.1]} />
        <meshStandardMaterial 
          color={mask.color} 
          transparent 
          opacity={0.2}
          emissive={mask.color}
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Emoji indicator */}
      <Text
        position={[0, 1.5, 0.1]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {mask.emoji}
      </Text>
    </group>
  )
}

// Simple 3D Mask Component - Hỗ trợ cả file 3D, ảnh mặt nạ, và procedural model
function Mask3D({ mask, position, rotation }) {
  // Ưu tiên 1: Nếu có modelPath, sử dụng file 3D GLB/GLTF (đẹp nhất)
  if (mask.modelPath) {
    return (
      <Model3DLoader
        modelPath={mask.modelPath}
        position={position}
        rotation={rotation}
        scale={1.5} // Điều chỉnh scale cho phù hợp với kích thước mặt nạ
        autoRotate={true}
        animationSpeed={0.5}
        fallback={
          mask.imagePath ? (
            <Suspense fallback={<ProceduralMask3D mask={mask} position={position} rotation={rotation} />}>
              <ImageMask3D mask={mask} position={position} rotation={rotation} />
            </Suspense>
          ) : (
            <ProceduralMask3D mask={mask} position={position} rotation={rotation} />
          )
        }
      />
    )
  }
  
  // Ưu tiên 2: Nếu có imagePath, sử dụng ảnh mặt nạ thật
  if (mask.imagePath) {
    return (
      <Suspense fallback={<ProceduralMask3D mask={mask} position={position} rotation={rotation} />}>
        <ImageMask3D mask={mask} position={position} rotation={rotation} />
      </Suspense>
    )
  }

  // Fallback về procedural model
  return <ProceduralMask3D mask={mask} position={position} rotation={rotation} />
}

// Procedural Mask Component (model tạo bằng code)
function ProceduralMask3D({ mask, position, rotation }) {
  const colorMap = {
    '#4a90e2': '#4a90e2',
    '#e74c3c': '#e74c3c',
    '#f39c12': '#f39c12',
    '#e91e63': '#e91e63',
    '#8e44ad': '#8e44ad',
    '#00bcd4': '#00bcd4'
  }

  return (
    <group position={position} rotation={rotation}>
      {/* Main face shape */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={colorMap[mask.color] || '#ffffff'} metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.3, 0.2, 0.9]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.3, 0.2, 0.9]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* Nose */}
      <mesh position={[0, -0.1, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.3, 16]} />
        <meshStandardMaterial color={colorMap[mask.color] || '#ffffff'} />
      </mesh>
      
      {/* Decorative elements based on mask type */}
      {mask.name.includes('Quan Văn') && (
        <>
          {/* Scholar hat */}
          <mesh position={[0, 0.8, 0.7]}>
            <cylinderGeometry args={[0.5, 0.6, 0.2, 16]} />
            <meshStandardMaterial color="#2c3e50" />
          </mesh>
          <mesh position={[0, 1.0, 0.7]}>
            <boxGeometry args={[0.8, 0.15, 0.1]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 1.15, 0.7]}>
            <boxGeometry args={[0.1, 0.25, 0.1]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Decorative beads */}
          <mesh position={[-0.2, 0.9, 0.75]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={1} />
          </mesh>
          <mesh position={[0.2, 0.9, 0.75]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={1} />
          </mesh>
        </>
      )}
      
      {mask.name.includes('Quan Võ') && (
        <>
          {/* Warrior helmet */}
          <mesh position={[0, 0.9, 0.7]}>
            <boxGeometry args={[0.7, 0.4, 0.5]} />
            <meshStandardMaterial color="#8b0000" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Helmet crest */}
          <mesh position={[0, 1.2, 0.7]}>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
            <meshStandardMaterial color="#c0392b" metalness={0.8} />
          </mesh>
          {/* Side decorations */}
          <mesh position={[-0.3, 0.9, 0.6]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#e74c3c" metalness={0.6} />
          </mesh>
          <mesh position={[0.3, 0.9, 0.6]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#e74c3c" metalness={0.6} />
          </mesh>
        </>
      )}
      
      {mask.name.includes('Hề') && (
        <>
          {/* Funny nose */}
          <mesh position={[0, -0.3, 0.95]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#ff6b6b" />
          </mesh>
          {/* Funny hat */}
          <mesh position={[0, 0.9, 0.7]}>
            <coneGeometry args={[0.4, 0.3, 8]} />
            <meshStandardMaterial color="#f39c12" />
          </mesh>
          {/* Bells on hat */}
          <mesh position={[-0.15, 1.0, 0.7]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} />
          </mesh>
          <mesh position={[0.15, 1.0, 0.7]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} />
          </mesh>
        </>
      )}
      
      {mask.name.includes('Nữ') && (
        <>
          {/* Hair decoration */}
          <mesh position={[0, 0.8, 0.7]}>
            <torusGeometry args={[0.3, 0.05, 8, 16]} />
            <meshStandardMaterial color="#e91e63" metalness={0.5} />
          </mesh>
          {/* Flowers */}
          <mesh position={[-0.2, 0.9, 0.75]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ff69b4" />
          </mesh>
          <mesh position={[0.2, 0.9, 0.75]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ff69b4" />
          </mesh>
        </>
      )}
      
      {mask.name.includes('Quỷ') && (
        <>
          {/* Horns */}
          <mesh position={[-0.2, 0.8, 0.7]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.08, 0.3, 8]} />
            <meshStandardMaterial color="#8e44ad" metalness={0.3} />
          </mesh>
          <mesh position={[0.2, 0.8, 0.7]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.08, 0.3, 8]} />
            <meshStandardMaterial color="#8e44ad" metalness={0.3} />
          </mesh>
          {/* Fangs */}
          <mesh position={[-0.15, -0.4, 0.9]}>
            <coneGeometry args={[0.05, 0.15, 4]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.15, -0.4, 0.9]}>
            <coneGeometry args={[0.05, 0.15, 4]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </>
      )}
      
      {mask.name.includes('Thần') && (
        <>
          {/* Halo */}
          <mesh position={[0, 0.9, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.5, 0.03, 8, 16]} />
            <meshStandardMaterial color="#00bcd4" emissive="#00bcd4" emissiveIntensity={0.5} />
          </mesh>
          {/* Glowing particles */}
          <mesh position={[-0.3, 0.7, 0.8]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#00bcd4" emissive="#00bcd4" emissiveIntensity={1} />
          </mesh>
          <mesh position={[0.3, 0.7, 0.8]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#00bcd4" emissive="#00bcd4" emissiveIntensity={1} />
          </mesh>
        </>
      )}
      
      {/* Weapons and accessories based on mask type */}
      {mask.name.includes('Quan Võ') && (
        <>
          {/* Sword on side */}
          <mesh position={[0.6, -0.3, 0.3]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.05, 0.8, 0.03]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Sword handle */}
          <mesh position={[0.6, -0.7, 0.3]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.08, 0.2, 0.08]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          {/* Shield */}
          <mesh position={[-0.6, -0.2, 0.2]} rotation={[0, 0, -Math.PI / 6]}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
            <meshStandardMaterial color="#8b0000" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Shield decoration */}
          <mesh position={[-0.6, -0.2, 0.25]}>
            <boxGeometry args={[0.15, 0.2, 0.02]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} />
          </mesh>
        </>
      )}
      
      {mask.name.includes('Quan Văn') && (
        <>
          {/* Scroll/book */}
          <mesh position={[0.5, -0.2, 0.3]} rotation={[0, 0, Math.PI / 6]}>
            <boxGeometry args={[0.15, 0.2, 0.05]} />
            <meshStandardMaterial color="#f5deb3" />
          </mesh>
          {/* Brush */}
          <mesh position={[-0.5, -0.3, 0.3]} rotation={[0, 0, -Math.PI / 6]}>
            <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh position={[-0.5, -0.2, 0.3]} rotation={[0, 0, -Math.PI / 6]}>
            <coneGeometry args={[0.03, 0.05, 8]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </>
      )}
      
      {mask.name.includes('Nữ') && (
        <>
          {/* Fan */}
          <mesh position={[0.5, -0.1, 0.3]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.2, 0.05, 0.01]} />
            <meshStandardMaterial color="#e91e63" />
          </mesh>
          {/* Jewelry box */}
          <mesh position={[-0.5, -0.3, 0.3]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} />
          </mesh>
        </>
      )}
      
      {mask.name.includes('Hề') && (
        <>
          {/* Juggling balls */}
          <mesh position={[0.4, 0.3, 0.5]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#ff6b6b" />
          </mesh>
          <mesh position={[-0.4, 0.3, 0.5]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#4ecdc4" />
          </mesh>
          {/* Rattle */}
          <mesh position={[0.5, -0.2, 0.3]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#f39c12" />
          </mesh>
        </>
      )}
      
      {mask.name.includes('Thần') && (
        <>
          {/* Magical staff */}
          <mesh position={[0.5, -0.5, 0.3]} rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          {/* Staff orb */}
          <mesh position={[0.7, -0.1, 0.4]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#00bcd4" emissive="#00bcd4" emissiveIntensity={1} />
          </mesh>
          {/* Floating crystals */}
          <mesh position={[-0.4, 0.2, 0.6]}>
            <octahedronGeometry args={[0.05, 0]} />
            <meshStandardMaterial color="#00bcd4" emissive="#00bcd4" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[-0.5, -0.1, 0.6]}>
            <octahedronGeometry args={[0.05, 0]} />
            <meshStandardMaterial color="#00bcd4" emissive="#00bcd4" emissiveIntensity={0.8} />
          </mesh>
        </>
      )}
      
      {/* Emoji overlay (as text) */}
      <Text
        position={[0, 0, 1.2]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {mask.emoji}
      </Text>
    </group>
  )
}

// Character 3D Model with detailed costumes - Hỗ trợ cả file 3D và procedural model
function Character3D({ character, costume, position }) {
  // Nếu có modelPath trong costume, sử dụng file 3D
  if (costume && costume.modelPath) {
    return (
      <Model3DLoader
        modelPath={costume.modelPath}
        position={position}
        autoRotate={false}
        fallback={<ProceduralCharacter3D character={character} costume={costume} position={position} />}
      />
    )
  }

  // Fallback về procedural model
  return <ProceduralCharacter3D character={character} costume={costume} position={position} />
}

// Procedural Character Component (model tạo bằng code)
function ProceduralCharacter3D({ character, costume, position }) {
  const costumeColor = costume ? costume.color : '#e74c3c'
  
  return (
    <group position={position}>
      {/* Head */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#fdbcb4" roughness={0.6} />
      </mesh>
      
      {/* Hair/Head accessories based on costume */}
      {costume && costume.type === 'quan-van' && (
        <>
          {/* Traditional hat base */}
          <mesh position={[0, 1.5, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.4, 0.2, 16]} />
            <meshStandardMaterial color="#2c3e50" />
          </mesh>
          {/* Crown top */}
          <mesh position={[0, 1.7, 0]}>
            <boxGeometry args={[0.25, 0.1, 0.1]} />
            <meshStandardMaterial color="#f1c40f" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Crown decorations */}
          <mesh position={[-0.1, 1.75, 0]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={1} roughness={0} />
          </mesh>
          <mesh position={[0.1, 1.75, 0]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={1} roughness={0} />
          </mesh>
        </>
      )}
      
      {costume && costume.type === 'nu-truyen-thong' && (
        <>
          {/* Traditional hair bun */}
          <mesh position={[0, 1.5, 0.1]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          {/* Hairpin */}
          <mesh position={[0, 1.55, 0.25]} rotation={[Math.PI / 6, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
            <meshStandardMaterial color="#e91e63" metalness={0.7} />
          </mesh>
          {/* Decorative flower */}
          <mesh position={[0.08, 1.5, 0.15]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#ff69b4" />
          </mesh>
        </>
      )}
      
      {costume && costume.type === 'cong-chua' && (
        <>
          {/* Princess crown */}
          <mesh position={[0, 1.6, 0]}>
            <coneGeometry args={[0.2, 0.3, 8]} />
            <meshStandardMaterial color="#9b59b6" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Crown jewels */}
          <mesh position={[0, 1.75, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={1} roughness={0} />
          </mesh>
        </>
      )}
      
      {costume && costume.type === 'he' && (
        <>
          {/* Funny hat */}
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.3, 0.35, 0.15, 16]} />
            <meshStandardMaterial color="#f39c12" />
          </mesh>
          {/* Hat decoration */}
          <mesh position={[0, 1.7, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ff6b6b" />
          </mesh>
        </>
      )}
      
      {/* Body - different shapes based on costume */}
      {costume && (costume.type === 'nu-truyen-thong' || costume.type === 'cong-chua') ? (
        <>
          {/* Dress - wider at bottom */}
          <mesh position={[0, 0.2, 0]}>
            <coneGeometry args={[0.5, 1.2, 8]} />
            <meshStandardMaterial 
              color={costumeColor}
              metalness={0.2}
              roughness={0.8}
            />
          </mesh>
          {/* Waist belt */}
          <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.45, 0.05, 8, 16]} />
            <meshStandardMaterial color="#2c3e50" metalness={0.5} />
          </mesh>
        </>
      ) : costume && costume.type === 'quan-vo' ? (
        <>
          {/* Armor body - more angular */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.85, 1.3, 0.5]} />
            <meshStandardMaterial 
              color={costumeColor}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          {/* Chest plate */}
          <mesh position={[0, 0.6, 0.3]}>
            <boxGeometry args={[0.7, 0.4, 0.15]} />
            <meshStandardMaterial color="#c0392b" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Shoulder pads */}
          <mesh position={[-0.4, 0.9, 0]}>
            <boxGeometry args={[0.2, 0.15, 0.2]} />
            <meshStandardMaterial color="#8b0000" metalness={0.7} />
          </mesh>
          <mesh position={[0.4, 0.9, 0]}>
            <boxGeometry args={[0.2, 0.15, 0.2]} />
            <meshStandardMaterial color="#8b0000" metalness={0.7} />
          </mesh>
        </>
      ) : costume && costume.type === 'dan-gian' ? (
        <>
          {/* Simple tunic */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.7, 1.1, 0.35]} />
            <meshStandardMaterial 
              color={costumeColor}
              metalness={0.1}
              roughness={0.9}
            />
          </mesh>
        </>
      ) : (
        <>
          {/* Default robe */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.8, 1.2, 0.4]} />
            <meshStandardMaterial 
              color={costumeColor}
              metalness={0.3}
              roughness={0.7}
            />
          </mesh>
          {/* Decorative sash for quan-van */}
          {costume && costume.type === 'quan-van' && (
            <mesh position={[0, 0.5, 0.25]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.6, 0.1, 0.05]} />
              <meshStandardMaterial color="#d4af37" metalness={0.6} />
            </mesh>
          )}
        </>
      )}
      
      {/* Arms - different sleeves */}
      {costume && (costume.type === 'nu-truyen-thong' || costume.type === 'cong-chua') ? (
        <>
          {/* Flowing sleeves */}
          <mesh position={[-0.5, 0.3, 0]} rotation={[0, 0, Math.PI / 6]}>
            <coneGeometry args={[0.12, 0.9, 8]} />
            <meshStandardMaterial color={costumeColor} />
          </mesh>
          <mesh position={[0.5, 0.3, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <coneGeometry args={[0.12, 0.9, 8]} />
            <meshStandardMaterial color={costumeColor} />
          </mesh>
        </>
      ) : (
        <>
          {/* Regular arms */}
          <mesh position={[-0.5, 0.3, 0]} rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh position={[0.5, 0.3, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
        </>
      )}
      
      {/* Legs - different styles */}
      {costume && (costume.type === 'nu-truyen-thong' || costume.type === 'cong-chua') ? (
        <>
          {/* Hidden under dress */}
        </>
      ) : costume && costume.type === 'quan-vo' ? (
        <>
          {/* Boots */}
          <mesh position={[-0.25, -0.7, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.85, 16]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.3} />
          </mesh>
          <mesh position={[0.25, -0.7, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.85, 16]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.3} />
          </mesh>
        </>
      ) : (
        <>
          {/* Regular legs */}
          <mesh position={[-0.25, -0.7, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.8, 16]} />
            <meshStandardMaterial color="#2c3e50" />
          </mesh>
          <mesh position={[0.25, -0.7, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.8, 16]} />
            <meshStandardMaterial color="#2c3e50" />
          </mesh>
        </>
      )}
      
      {/* Weapons and Accessories based on costume */}
      {costume && costume.type === 'quan-vo' && (
        <>
          {/* Main sword on back */}
          <mesh position={[0.3, 0.5, -0.2]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.05, 0.7, 0.05]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Sword handle detail */}
          <mesh position={[0.3, 0.85, -0.2]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.08, 0.15, 0.08]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          {/* Sword guard */}
          <mesh position={[0.3, 0.5, -0.2]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.15, 0.05, 0.05]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} />
          </mesh>
          {/* Secondary weapon - Dagger */}
          <mesh position={[-0.4, 0.3, -0.15]} rotation={[0, 0, -Math.PI / 3]}>
            <boxGeometry args={[0.03, 0.3, 0.03]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.9} />
          </mesh>
          {/* Shield on arm */}
          <mesh position={[-0.6, 0.2, 0.1]} rotation={[0, Math.PI / 6, -Math.PI / 6]}>
            <cylinderGeometry args={[0.25, 0.25, 0.08, 16]} />
            <meshStandardMaterial color="#8b0000" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Shield emblem */}
          <mesh position={[-0.6, 0.2, 0.15]} rotation={[0, Math.PI / 6, -Math.PI / 6]}>
            <boxGeometry args={[0.12, 0.15, 0.02]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} />
          </mesh>
          {/* Armor belt */}
          <mesh position={[0, 0.1, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.45, 0.06, 8, 16]} />
            <meshStandardMaterial color="#2c3e50" metalness={0.6} />
          </mesh>
          {/* Belt buckle */}
          <mesh position={[0, 0.1, 0.36]}>
            <boxGeometry args={[0.1, 0.08, 0.02]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} />
          </mesh>
        </>
      )}
      
      {costume && costume.type === 'quan-van' && (
        <>
          {/* Scroll/book in hand */}
          <mesh position={[0.5, 0.1, 0.2]} rotation={[0, 0, Math.PI / 6]}>
            <boxGeometry args={[0.12, 0.18, 0.04]} />
            <meshStandardMaterial color="#f5deb3" />
          </mesh>
          {/* Writing brush */}
          <mesh position={[-0.5, 0.2, 0.2]} rotation={[0, 0, -Math.PI / 6]}>
            <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh position={[-0.5, 0.3, 0.2]} rotation={[0, 0, -Math.PI / 6]}>
            <coneGeometry args={[0.025, 0.04, 8]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          {/* Ink stone */}
          <mesh position={[-0.4, -0.1, 0.25]}>
            <boxGeometry args={[0.1, 0.05, 0.1]} />
            <meshStandardMaterial color="#2c3e50" />
          </mesh>
          {/* Seal/stamp */}
          <mesh position={[0.4, -0.1, 0.25]}>
            <cylinderGeometry args={[0.04, 0.04, 0.06, 8]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} />
          </mesh>
          {/* Fan */}
          <mesh position={[0.3, 0.4, 0.3]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.15, 0.04, 0.01]} />
            <meshStandardMaterial color="#f1c40f" />
          </mesh>
        </>
      )}
      
      {costume && costume.type === 'nu-truyen-thong' && (
        <>
          {/* Traditional fan */}
          <mesh position={[0.5, 0.2, 0.2]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.2, 0.05, 0.01]} />
            <meshStandardMaterial color="#e91e63" />
          </mesh>
          {/* Fan handle */}
          <mesh position={[0.6, 0.1, 0.2]} rotation={[0, 0, Math.PI / 4]}>
            <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          {/* Jewelry box */}
          <mesh position={[-0.5, -0.1, 0.25]}>
            <boxGeometry args={[0.12, 0.1, 0.12]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} />
          </mesh>
          {/* Box lid */}
          <mesh position={[-0.5, 0.05, 0.25]}>
            <boxGeometry args={[0.12, 0.02, 0.12]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} />
          </mesh>
          {/* Hair ornaments */}
          <mesh position={[-0.15, 1.5, 0.2]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={1} />
          </mesh>
          <mesh position={[0.15, 1.5, 0.2]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={1} />
          </mesh>
          {/* Handbag */}
          <mesh position={[-0.4, 0.0, 0.3]}>
            <boxGeometry args={[0.08, 0.1, 0.05]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
        </>
      )}
      
      {costume && costume.type === 'cong-chua' && (
        <>
          {/* Royal scepter */}
          <mesh position={[0.5, 0.0, 0.2]} rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
            <meshStandardMaterial color="#9b59b6" metalness={0.7} />
          </mesh>
          {/* Scepter top */}
          <mesh position={[0.7, 0.25, 0.3]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={1} emissive="#ffd700" emissiveIntensity={0.3} />
          </mesh>
          {/* Jewelry - earrings */}
          <mesh position={[0.2, 1.1, 0.3]}>
            <torusGeometry args={[0.02, 0.01, 8, 16]} />
            <meshStandardMaterial color="#ffd700" metalness={1} />
          </mesh>
          <mesh position={[-0.2, 1.1, 0.3]}>
            <torusGeometry args={[0.02, 0.01, 8, 16]} />
            <meshStandardMaterial color="#ffd700" metalness={1} />
          </mesh>
          {/* Necklace */}
          <mesh position={[0, 1.0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.25, 0.02, 8, 16]} />
            <meshStandardMaterial color="#ffd700" metalness={1} />
          </mesh>
          {/* Necklace pendant */}
          <mesh position={[0, 0.75, 0.3]}>
            <octahedronGeometry args={[0.03, 0]} />
            <meshStandardMaterial color="#9b59b6" metalness={0.8} />
          </mesh>
          {/* Royal fan */}
          <mesh position={[-0.5, 0.2, 0.2]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.18, 0.04, 0.01]} />
            <meshStandardMaterial color="#9b59b6" />
          </mesh>
        </>
      )}
      
      {costume && costume.type === 'he' && (
        <>
          {/* Juggling balls */}
          <mesh position={[0.4, 0.5, 0.4]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#ff6b6b" />
          </mesh>
          <mesh position={[-0.4, 0.5, 0.4]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#4ecdc4" />
          </mesh>
          <mesh position={[0, 0.6, 0.4]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#f39c12" />
          </mesh>
          {/* Rattle */}
          <mesh position={[0.5, 0.1, 0.3]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#f39c12" />
          </mesh>
          {/* Rattle handle */}
          <mesh position={[0.5, -0.05, 0.3]}>
            <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          {/* Funny hat decorations */}
          <mesh position={[0.2, 1.6, 0.2]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#ff6b6b" />
          </mesh>
          <mesh position={[-0.2, 1.6, 0.2]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#4ecdc4" />
          </mesh>
        </>
      )}
      
      {costume && costume.type === 'dan-gian' && (
        <>
          {/* Bamboo hat */}
          <mesh position={[0, 1.6, 0]} rotation={[0, 0, 0]}>
            <coneGeometry args={[0.4, 0.15, 16]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          {/* Hat strap */}
          <mesh position={[0, 1.5, 0.2]}>
            <torusGeometry args={[0.2, 0.02, 8, 16]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
          {/* Basket */}
          <mesh position={[-0.5, -0.2, 0.2]}>
            <cylinderGeometry args={[0.12, 0.15, 0.15, 8]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          {/* Basket handle */}
          <mesh position={[-0.5, -0.1, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.13, 0.01, 8, 16]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
          {/* Simple bag */}
          <mesh position={[0.4, 0.0, 0.25]}>
            <boxGeometry args={[0.1, 0.12, 0.06]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
        </>
      )}
      
      {/* Emoji indicator with glow */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {costume ? costume.emoji : character?.emoji || '👤'}
      </Text>
    </group>
  )
}

function Viewer3D() {
  const [selectedMask, setSelectedMask] = useState(maskData[0])
  const [selectedCostume, setSelectedCostume] = useState(costumeData[0])
  const [viewMode, setViewMode] = useState('mask') // 'mask' or 'character'
  const [autoRotate, setAutoRotate] = useState(true)

  return (
    <div className="viewer-3d">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="viewer-header"
        >
          <h2 className="section-title">
            <span className="viewer-3d-icon">🎨</span> Xem 3D
          </h2>
          <p className="section-subtitle">
            Khám phá mặt nạ và nhân vật Tuồng trong không gian 3D
          </p>
        </motion.div>

        <div className="viewer-content">
          <div className="viewer-controls">
            <div className="control-section">
              <h3>Chế Độ Xem</h3>
              <div className="mode-buttons">
                <button
                  className={`mode-btn ${viewMode === 'mask' ? 'active' : ''}`}
                  onClick={() => setViewMode('mask')}
                >
                  🎭 Mặt Nạ
                </button>
                <button
                  className={`mode-btn ${viewMode === 'character' ? 'active' : ''}`}
                  onClick={() => setViewMode('character')}
                >
                  👤 Nhân Vật
                </button>
              </div>
            </div>

            {viewMode === 'mask' && (
              <div className="control-section">
                <h3>Chọn Mặt Nạ</h3>
                <div className="mask-selector-3d">
                  {maskData.map((mask) => (
                    <motion.button
                      key={mask.id}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`mask-btn-3d ${
                        selectedMask.id === mask.id ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedMask(mask)}
                      style={{
                        borderColor: mask.color,
                        backgroundColor:
                          selectedMask.id === mask.id
                            ? mask.color + '30'
                            : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <span style={{ fontSize: '2rem' }}>{mask.emoji}</span>
                      <span>{mask.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'character' && (
              <div className="control-section">
                <h3>Chọn Trang Phục</h3>
                <div className="mask-selector-3d">
                  {costumeData.map((costume) => (
                    <motion.button
                      key={costume.id}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`mask-btn-3d ${
                        selectedCostume.id === costume.id ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedCostume(costume)}
                      style={{
                        borderColor: costume.color,
                        backgroundColor:
                          selectedCostume.id === costume.id
                            ? costume.color + '30'
                            : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <span style={{ fontSize: '2rem' }}>{costume.emoji}</span>
                      <span>{costume.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <div className="control-section">
              <h3>Điều Khiển</h3>
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={autoRotate}
                  onChange={(e) => setAutoRotate(e.target.checked)}
                />
                <span>Tự động xoay</span>
              </label>
            </div>

            {viewMode === 'mask' ? (
              <div className="mask-info-3d">
                <h4>{selectedMask.name}</h4>
                <p>{selectedMask.description}</p>
                <div className="info-details">
                  <div className="info-item">
                    <span className="info-label">Màu sắc:</span>
                    <span
                      className="info-value"
                      style={{ color: selectedMask.color }}
                    >
                      {selectedMask.color}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mask-info-3d">
                <h4>{selectedCostume.name}</h4>
                <p>{selectedCostume.description}</p>
                <div className="info-details">
                  <div className="info-item">
                    <span className="info-label">Màu sắc:</span>
                    <span
                      className="info-value"
                      style={{ color: selectedCostume.color }}
                    >
                      {selectedCostume.color}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Chất liệu:</span>
                    <span className="info-value">{selectedCostume.details.material}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Ý nghĩa:</span>
                    <span className="info-value">{selectedCostume.details.meaning}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="canvas-container">
            <Canvas shadows>
              <Suspense fallback={null}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                <ambientLight intensity={0.6} />
                <directionalLight
                  position={[5, 8, 5]}
                  intensity={1.2}
                  castShadow
                  color="#ffffff"
                />
                <directionalLight
                  position={[-5, 3, -5]}
                  intensity={0.4}
                  color="#ffd700"
                />
                <pointLight position={[0, 5, 5]} intensity={0.8} color="#ffffff" />
                <spotLight
                  position={[0, 10, 0]}
                  angle={0.3}
                  penumbra={1}
                  intensity={1}
                  castShadow
                />
                
                <OrbitControls
                  autoRotate={autoRotate}
                  autoRotateSpeed={1}
                  enableZoom={true}
                  enablePan={true}
                  minDistance={2}
                  maxDistance={10}
                />

                {viewMode === 'mask' ? (
                  <Mask3D
                    mask={selectedMask}
                    position={[0, 0, 0]}
                    rotation={[0, 0, 0]}
                  />
                ) : (
                  <Character3D
                    character={{
                      emoji: '👤',
                      costume: { color: 'Đỏ' }
                    }}
                    costume={selectedCostume}
                    position={[0, 0, 0]}
                  />
                )}

                <Environment preset="studio" />
              </Suspense>
            </Canvas>
          </div>
        </div>

        <div className="viewer-instructions">
          <h3>Hướng Dẫn</h3>
          <ul>
            <li>🖱️ Kéo chuột để xoay model</li>
            <li>🔍 Cuộn chuột để zoom in/out</li>
            <li>👆 Click và kéo để di chuyển góc nhìn</li>
            <li>🎭 Chọn mặt nạ khác để xem model 3D tương ứng</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Viewer3D

