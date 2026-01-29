import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Environment } from '@react-three/drei'
import { Model3DLoader } from './Model3D'

// 3D Object Components with enhanced animations - Hỗ trợ cả file 3D và procedural model
function Object3D({ obj, position, onClick }) {
  // Nếu có modelPath, sử dụng file 3D
  if (obj.modelPath) {
    // Xác định màu sắc và scale dựa trên loại object
    const getObjectConfig = () => {
      if (obj.id === 'sword') {
        return { color: '#c0c0c0', scale: 0.008, metalness: 0.9, rotation: [0, 0, 0], autoRotate: true } // Bạc cho kiếm (rất nhỏ)
      } else if (obj.id === 'helmet' || obj.id === 'vương-miện') {
        return { color: '#ffd700', scale: 0.007, metalness: 0.8, rotation: [0, 0, 0], autoRotate: true } // Vàng cho vương miện (rất nhỏ)
      } else if (obj.id === 'horse') {
        return { color: '#8b4513', scale: 0.01, metalness: 0.1, rotation: [Math.PI / 2 + (160 * Math.PI / 180), Math.PI + Math.PI, 0], autoRotate: false, positionOffset: [0, 0.3, 0] } // Nâu cho ngựa (nhỏ hơn, nâng lên cao)
      } else if (obj.id === 'pot') {
        return { color: '#cd853f', scale: 0.01, metalness: 0.1, rotation: [0, Math.PI / 2, 0], autoRotate: true } // Nâu đất cho nồi (xoay 90 độ Y)
      }
      return { color: '#cccccc', scale: 0.1, metalness: 0.3, rotation: [0, 0, 0], autoRotate: true } // Mặc định
    }

    const config = getObjectConfig()
    
    // Áp dụng position offset nếu có
    const finalPosition = config.positionOffset 
      ? [position[0] + config.positionOffset[0], position[1] + config.positionOffset[1], position[2] + config.positionOffset[2]]
      : position

    return (
      <Model3DLoader
        modelPath={obj.modelPath}
        position={finalPosition}
        rotation={config.rotation}
        scale={config.scale}
        color={config.color}
        metalness={config.metalness}
        autoRotate={config.autoRotate}
        animationSpeed={0.5}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
        fallback={<ProceduralObject3D obj={obj} position={position} onClick={onClick} />}
      />
    )
  }

  // Fallback về procedural model
  return <ProceduralObject3D obj={obj} position={position} onClick={onClick} />
}

// Procedural Object Component (model tạo bằng code)
function ProceduralObject3D({ obj, position, onClick }) {
  const meshRef = useRef()
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current) {
      // Floating animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1
      // Gentle rotation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2
      // Slight scale pulse
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05
      groupRef.current.scale.set(scale, scale, scale)
    }
  })

  const getObjectGeometry = () => {
    switch (obj.id) {
      case 'sword':
        return (
          <group>
            {/* Blade */}
            <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.05, 0.7, 0.03]} />
              <meshStandardMaterial 
                color="#c0c0c0" 
                metalness={0.95} 
                roughness={0.05}
                emissive="#ffffff"
                emissiveIntensity={0.1}
              />
            </mesh>
            {/* Blade tip */}
            <mesh position={[0, 0.65, 0]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.05, 0.1, 4]} />
              <meshStandardMaterial color="#ffffff" metalness={1} roughness={0} />
            </mesh>
            {/* Guard */}
            <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.15, 0.05, 0.05]} />
              <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Handle */}
            <mesh position={[0, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.06, 0.06, 0.2, 8]} />
              <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </mesh>
            {/* Pommel */}
            <mesh position={[0, -0.2, 0]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#d4af37" metalness={0.8} />
            </mesh>
          </group>
        )
      case 'helmet':
        return (
          <group>
            {/* Main helmet body */}
            <mesh>
              <boxGeometry args={[0.35, 0.3, 0.35]} />
              <meshStandardMaterial 
                color="#d4af37" 
                metalness={0.9} 
                roughness={0.1}
                emissive="#ffd700"
                emissiveIntensity={0.2}
              />
            </mesh>
            {/* Crown top */}
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[0.12, 0.2, 0.12]} />
              <meshStandardMaterial color="#ffd700" metalness={1} roughness={0} />
            </mesh>
            {/* Decorative beads */}
            <mesh position={[-0.15, 0.15, 0.2]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshStandardMaterial color="#ffd700" metalness={1} />
            </mesh>
            <mesh position={[0.15, 0.15, 0.2]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshStandardMaterial color="#ffd700" metalness={1} />
            </mesh>
            {/* Side decorations */}
            <mesh position={[-0.2, 0.1, 0]}>
              <boxGeometry args={[0.05, 0.1, 0.05]} />
              <meshStandardMaterial color="#d4af37" metalness={0.8} />
            </mesh>
            <mesh position={[0.2, 0.1, 0]}>
              <boxGeometry args={[0.05, 0.1, 0.05]} />
              <meshStandardMaterial color="#d4af37" metalness={0.8} />
            </mesh>
          </group>
        )
      case 'robe':
        return (
          <mesh>
            <boxGeometry args={[0.4, 0.6, 0.3]} />
            <meshStandardMaterial color="#e74c3c" metalness={0.2} roughness={0.8} />
          </mesh>
        )
      case 'beard':
        return (
          <mesh>
            <boxGeometry args={[0.2, 0.3, 0.1]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
        )
      case 'fan':
        return (
          <group rotation={[0, 0, Math.PI / 4]}>
            {/* Fan body - multiple segments */}
            {[...Array(8)].map((_, i) => (
              <mesh
                key={i}
                rotation={[0, (i - 4) * 0.1, 0]}
                position={[0, 0, i * 0.01]}
              >
                <boxGeometry args={[0.35, 0.04, 0.01]} />
                <meshStandardMaterial 
                  color={i % 2 === 0 ? '#e91e63' : '#ff69b4'} 
                  metalness={0.1}
                  roughness={0.9}
                />
              </mesh>
            ))}
            {/* Fan handle */}
            <mesh position={[0, -0.2, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
              <meshStandardMaterial color="#8b4513" />
            </mesh>
            {/* Decorative tassel */}
            <mesh position={[0, -0.3, 0]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="#ffd700" metalness={0.8} />
            </mesh>
          </group>
        )
      case 'hairpin':
        return (
          <mesh rotation={[Math.PI / 6, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} />
          </mesh>
        )
      case 'dress':
        return (
          <mesh>
            <coneGeometry args={[0.3, 0.6, 8]} />
            <meshStandardMaterial color="#e91e63" metalness={0.1} roughness={0.9} />
          </mesh>
        )
      case 'basket':
        return (
          <group>
            {/* Basket body with texture pattern */}
            <mesh>
              <cylinderGeometry args={[0.18, 0.2, 0.25, 12]} />
              <meshStandardMaterial 
                color="#8b4513" 
                roughness={0.9}
                metalness={0.1}
              />
            </mesh>
            {/* Inner basket */}
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.16, 0.18, 0.2, 12]} />
              <meshStandardMaterial color="#654321" roughness={0.9} />
            </mesh>
            {/* Handle */}
            <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.19, 0.015, 8, 16]} />
              <meshStandardMaterial color="#654321" roughness={0.8} />
            </mesh>
            {/* Decorative flowers inside */}
            {[...Array(3)].map((_, i) => (
              <mesh
                key={i}
                position={[
                  Math.cos(i * Math.PI * 2 / 3) * 0.08,
                  0.02,
                  Math.sin(i * Math.PI * 2 / 3) * 0.08
                ]}
              >
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshStandardMaterial 
                  color={['#ff69b4', '#ffb6c1', '#ff1493'][i]} 
                  roughness={0.7}
                />
              </mesh>
            ))}
          </group>
        )
      case 'banner':
        return (
          <group>
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[0.4, 0.6, 0.02]} />
              <meshStandardMaterial color="#e74c3c" />
            </mesh>
            <mesh position={[0, 0.6, 0]}>
              <boxGeometry args={[0.05, 0.2, 0.05]} />
              <meshStandardMaterial color="#8b4513" />
            </mesh>
          </group>
        )
      case 'scroll':
        return (
          <mesh rotation={[0, Math.PI / 4, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
            <meshStandardMaterial color="#f5deb3" />
          </mesh>
        )
      case 'horse':
        return (
          <group>
            {/* Body */}
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[0.5, 0.35, 0.25]} />
              <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.5, 0.15]}>
              <boxGeometry args={[0.2, 0.25, 0.15]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
            {/* Ears */}
            <mesh position={[-0.08, 0.6, 0.15]}>
              <coneGeometry args={[0.03, 0.08, 4]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
            <mesh position={[0.08, 0.6, 0.15]}>
              <coneGeometry args={[0.03, 0.08, 4]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
            {/* Mane */}
            <mesh position={[0, 0.55, 0.1]}>
              <boxGeometry args={[0.15, 0.2, 0.05]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
            {/* Legs */}
            {[-0.2, 0.2].map((x, i) => (
              <group key={i}>
                <mesh position={[x, 0.1, -0.1]}>
                  <cylinderGeometry args={[0.06, 0.06, 0.25, 8]} />
                  <meshStandardMaterial color="#654321" />
                </mesh>
                <mesh position={[x, 0.1, 0.1]}>
                  <cylinderGeometry args={[0.06, 0.06, 0.25, 8]} />
                  <meshStandardMaterial color="#654321" />
                </mesh>
              </group>
            ))}
            {/* Saddle */}
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.4, 0.08, 0.2]} />
              <meshStandardMaterial color="#8b4513" metalness={0.3} />
            </mesh>
          </group>
        )
      case 'drum':
        return (
          <group>
            {/* Drum body */}
            <mesh>
              <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
              <meshStandardMaterial 
                color="#8b4513" 
                roughness={0.8}
                metalness={0.1}
              />
            </mesh>
            {/* Top drumhead */}
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 0.02, 16]} />
              <meshStandardMaterial 
                color="#654321" 
                roughness={0.9}
                metalness={0}
              />
            </mesh>
            {/* Bottom drumhead */}
            <mesh position={[0, -0.1, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 0.02, 16]} />
              <meshStandardMaterial 
                color="#654321" 
                roughness={0.9}
                metalness={0}
              />
            </mesh>
            {/* Decorative rings */}
            <mesh position={[0, 0.12, 0]}>
              <torusGeometry args={[0.25, 0.02, 8, 16]} />
              <meshStandardMaterial color="#d4af37" metalness={0.7} />
            </mesh>
            <mesh position={[0, -0.12, 0]}>
              <torusGeometry args={[0.25, 0.02, 8, 16]} />
              <meshStandardMaterial color="#d4af37" metalness={0.7} />
            </mesh>
            {/* Drumsticks */}
            <mesh position={[-0.3, 0.15, 0]} rotation={[0, 0, Math.PI / 6]}>
              <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
              <meshStandardMaterial color="#8b4513" />
            </mesh>
            <mesh position={[0.3, 0.15, 0]} rotation={[0, 0, -Math.PI / 6]}>
              <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
              <meshStandardMaterial color="#8b4513" />
            </mesh>
          </group>
        )
      
      case 'flower':
        return (
          <group>
            {/* Stem */}
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
              <meshStandardMaterial color="#228B22" />
            </mesh>
            {/* Petals */}
            {[...Array(8)].map((_, i) => (
              <mesh
                key={i}
                position={[
                  Math.cos(i * Math.PI / 4) * 0.08,
                  0.25,
                  Math.sin(i * Math.PI / 4) * 0.08
                ]}
                rotation={[0, i * Math.PI / 4, 0]}
              >
                <boxGeometry args={[0.06, 0.1, 0.02]} />
                <meshStandardMaterial 
                  color={i % 2 === 0 ? '#ff69b4' : '#ffb6c1'}
                  roughness={0.7}
                />
              </mesh>
            ))}
            {/* Center */}
            <mesh position={[0, 0.25, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#ffd700" />
            </mesh>
          </group>
        )
      
      case 'pond':
        return (
          <group>
            {/* Water surface */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.8, 0.8, 0.05, 16]} />
              <meshStandardMaterial 
                color="#4682B4" 
                transparent
                opacity={0.7}
                roughness={0.1}
                metalness={0.3}
              />
            </mesh>
            {/* Pond edge */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.8, 0.1, 8, 16]} />
              <meshStandardMaterial color="#8b4513" />
            </mesh>
            {/* Lily pads */}
            {[...Array(3)].map((_, i) => (
              <mesh
                key={i}
                position={[
                  Math.cos(i * Math.PI * 2 / 3) * 0.3,
                  0.05,
                  Math.sin(i * Math.PI * 2 / 3) * 0.3
                ]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <circleGeometry args={[0.15, 8]} />
                <meshStandardMaterial color="#228B22" />
              </mesh>
            ))}
          </group>
        )
      
      case 'bridge':
        return (
          <group>
            {/* Bridge deck */}
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[1, 0.1, 0.3]} />
              <meshStandardMaterial color="#a0a0a0" roughness={0.8} />
            </mesh>
            {/* Bridge supports */}
            {[-0.4, 0.4].map((x, i) => (
              <mesh key={i} position={[x, 0, 0]}>
                <boxGeometry args={[0.1, 0.2, 0.1]} />
                <meshStandardMaterial color="#808080" />
              </mesh>
            ))}
            {/* Railings */}
            <mesh position={[0, 0.15, -0.15]}>
              <boxGeometry args={[1, 0.05, 0.05]} />
              <meshStandardMaterial color="#8b4513" />
            </mesh>
            <mesh position={[0, 0.15, 0.15]}>
              <boxGeometry args={[1, 0.05, 0.05]} />
              <meshStandardMaterial color="#8b4513" />
            </mesh>
          </group>
        )
      
      case 'throne':
        return (
          <group>
            {/* Throne base */}
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[0.8, 0.4, 0.6]} />
              <meshStandardMaterial 
                color="#ffd700" 
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            {/* Backrest */}
            <mesh position={[0, 0.6, -0.2]}>
              <boxGeometry args={[0.9, 0.8, 0.1]} />
              <meshStandardMaterial 
                color="#d4af37" 
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            {/* Armrests */}
            <mesh position={[-0.4, 0.4, 0]}>
              <boxGeometry args={[0.1, 0.2, 0.3]} />
              <meshStandardMaterial color="#ffd700" metalness={0.9} />
            </mesh>
            <mesh position={[0.4, 0.4, 0]}>
              <boxGeometry args={[0.1, 0.2, 0.3]} />
              <meshStandardMaterial color="#ffd700" metalness={0.9} />
            </mesh>
            {/* Decorative dragons */}
            {[-0.35, 0.35].map((x, i) => (
              <mesh key={i} position={[x, 0.8, -0.15]}>
                <boxGeometry args={[0.15, 0.3, 0.1]} />
                <meshStandardMaterial color="#c0392b" metalness={0.7} />
              </mesh>
            ))}
            {/* Crown on top */}
            <mesh position={[0, 1.1, -0.2]}>
              <boxGeometry args={[0.3, 0.15, 0.1]} />
              <meshStandardMaterial color="#ffd700" metalness={1} />
            </mesh>
          </group>
        )
      
      case 'scepter':
        return (
          <group>
            {/* Staff */}
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
              <meshStandardMaterial 
                color="#9b59b6" 
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
            {/* Top orb */}
            <mesh position={[0, 0.65, 0]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial 
                color="#ffd700" 
                metalness={1}
                roughness={0}
                emissive="#ffd700"
                emissiveIntensity={0.3}
              />
            </mesh>
            {/* Decorative rings */}
            {[0.5, 0.55, 0.6].map((y, i) => (
              <mesh key={i} position={[0, y, 0]}>
                <torusGeometry args={[0.08, 0.01, 8, 16]} />
                <meshStandardMaterial color="#d4af37" metalness={0.9} />
              </mesh>
            ))}
          </group>
        )
      
      case 'scroll2':
        return (
          <group>
            {/* Scroll body */}
            <mesh position={[0, 0.1, 0]} rotation={[0, Math.PI / 4, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
              <meshStandardMaterial 
                color="#f5deb3" 
                roughness={0.8}
              />
            </mesh>
            {/* Scroll ends */}
            <mesh position={[0, 0.1, 0.12]} rotation={[0, Math.PI / 4, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.05, 8]} />
              <meshStandardMaterial color="#d4af37" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.1, -0.12]} rotation={[0, Math.PI / 4, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.05, 8]} />
              <meshStandardMaterial color="#d4af37" metalness={0.8} />
            </mesh>
            {/* Seal */}
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.03, 8]} />
              <meshStandardMaterial color="#c0392b" metalness={0.6} />
            </mesh>
          </group>
        )
      default:
        return (
          <mesh>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial color="#888888" />
          </mesh>
        )
    }
  }

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        if (groupRef.current) {
          groupRef.current.scale.set(1.2, 1.2, 1.2)
        }
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
        if (groupRef.current) {
          groupRef.current.scale.set(1, 1, 1)
        }
      }}
    >
      {/* Glow effect */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.1}
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {getObjectGeometry()}
      
      {/* Name label */}
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.12}
        color="#ffd700"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {obj.name}
      </Text>
      
      {/* Emoji indicator */}
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {obj.emoji}
      </Text>
    </group>
  )
}

// Scene 3D Component
function Scene3D({ objects, sceneType, onObjectClick }) {
  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color={sceneType === 'battlefield' ? '#8B4513' : 
                 sceneType === 'home' ? '#DDA0DD' : '#4682B4'}
          roughness={0.8}
        />
      </mesh>

      {/* Scene-specific 3D elements */}
      {sceneType === 'battlefield' && (
        <>
          {/* Flags */}
          <mesh position={[-3, 1, -3]}>
            <boxGeometry args={[0.05, 2, 0.05]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh position={[-3, 2, -3]}>
            <boxGeometry args={[0.8, 0.5, 0.02]} />
            <meshStandardMaterial color="#e74c3c" />
          </mesh>
          <mesh position={[3, 1, -3]}>
            <boxGeometry args={[0.05, 2, 0.05]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh position={[3, 2, -3]}>
            <boxGeometry args={[0.8, 0.5, 0.02]} />
            <meshStandardMaterial color="#e74c3c" />
          </mesh>
          {/* Weapons rack */}
          <mesh position={[-2, 0.5, 2]}>
            <boxGeometry args={[1, 0.1, 0.5]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
        </>
      )}

      {sceneType === 'home' && (
        <>
          {/* Traditional table */}
          <mesh position={[0, 0, -2]} receiveShadow>
            <boxGeometry args={[1.8, 0.12, 1]} />
            <meshStandardMaterial color="#8b4513" roughness={0.8} />
          </mesh>
          {/* Table legs */}
          {[
            [-0.8, -0.2, -1.4],
            [0.8, -0.2, -1.4],
            [-0.8, -0.2, -0.6],
            [0.8, -0.2, -0.6]
          ].map((pos, i) => (
            <mesh key={i} position={pos} receiveShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
          ))}
          {/* Vase with flowers */}
          <mesh position={[0.6, 0.4, -2]}>
            <cylinderGeometry args={[0.18, 0.22, 0.35, 12]} />
            <meshStandardMaterial 
              color="#e91e63" 
              metalness={0.2}
              roughness={0.7}
            />
          </mesh>
          {/* Flowers in vase */}
          {[...Array(5)].map((_, i) => (
            <mesh
              key={i}
              position={[
                0.6 + Math.cos(i * Math.PI * 2 / 5) * 0.1,
                0.55 + i * 0.05,
                -2 + Math.sin(i * Math.PI * 2 / 5) * 0.1
              ]}
            >
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial 
                color={['#ff69b4', '#ff1493', '#ffb6c1', '#ff69b4', '#ff1493'][i]}
                roughness={0.6}
              />
            </mesh>
          ))}
          {/* Traditional chair */}
          <mesh position={[-1.5, 0.2, -2]} receiveShadow>
            <boxGeometry args={[0.4, 0.5, 0.4]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
          {/* Window frame */}
          <mesh position={[0, 1.5, -3]}>
            <boxGeometry args={[2, 1.5, 0.1]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
        </>
      )}
      
      {sceneType === 'garden' && (
        <>
          {/* Garden ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#90EE90" roughness={0.9} />
          </mesh>
          {/* Trees */}
          {[-3, 3].map((x, i) => (
            <group key={i} position={[x, 0, -3]}>
              <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 1, 8]} />
                <meshStandardMaterial color="#8b4513" />
              </mesh>
              <mesh position={[0, 1.2, 0]}>
                <coneGeometry args={[0.8, 1.2, 8]} />
                <meshStandardMaterial color="#228B22" />
              </mesh>
            </group>
          ))}
          {/* Flower beds */}
          {[...Array(6)].map((_, i) => (
            <mesh
              key={i}
              position={[
                Math.cos(i * Math.PI / 3) * 2,
                0.1,
                Math.sin(i * Math.PI / 3) * 2
              ]}
            >
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshStandardMaterial 
                color={['#ff69b4', '#ff1493', '#ffb6c1', '#ff69b4', '#ff1493', '#ffb6c1'][i]}
                roughness={0.7}
              />
            </mesh>
          ))}
          {/* Stone path */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}>
            <boxGeometry args={[1, 0.04, 4]} />
            <meshStandardMaterial color="#a0a0a0" roughness={0.8} />
          </mesh>
        </>
      )}
      
      {sceneType === 'palace' && (
        <>
          {/* Palace floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial 
              color="#DAA520" 
              metalness={0.3}
              roughness={0.6}
            />
          </mesh>
          {/* Pillars */}
          {[-2, 0, 2].map((x, i) => (
            <group key={i} position={[x, 1, -2]}>
              <mesh>
                <cylinderGeometry args={[0.2, 0.2, 2, 16]} />
                <meshStandardMaterial 
                  color="#ffd700" 
                  metalness={0.7}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[0, 1.2, 0]}>
                <boxGeometry args={[0.5, 0.2, 0.5]} />
                <meshStandardMaterial color="#d4af37" metalness={0.8} />
              </mesh>
            </group>
          ))}
          {/* Throne */}
          <mesh position={[0, 0.3, -3]}>
            <boxGeometry args={[1, 0.6, 0.8]} />
            <meshStandardMaterial 
              color="#ffd700" 
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, 0.8, -3]}>
            <boxGeometry args={[1.2, 0.4, 0.1]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} />
          </mesh>
          {/* Decorative dragons */}
          {[-1.5, 1.5].map((x, i) => (
            <mesh key={i} position={[x, 1.5, -2.5]}>
              <boxGeometry args={[0.3, 0.4, 0.2]} />
              <meshStandardMaterial color="#c0392b" metalness={0.6} />
            </mesh>
          ))}
        </>
      )}

      {sceneType === 'camp' && (
        <>
          {/* Tent */}
          <mesh position={[-2, 0.5, -2]}>
            <coneGeometry args={[1, 1.5, 8]} />
            <meshStandardMaterial color="#4682B4" />
          </mesh>
          {/* Map table */}
          <mesh position={[2, 0.2, -2]}>
            <boxGeometry args={[1, 0.1, 0.6]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
        </>
      )}

      {/* Interactive Objects */}
      {objects.map((obj) => (
        <Object3D
          key={obj.id}
          obj={obj}
          position={[
            (obj.position.x / 100) * 8 - 4,
            0,
            (obj.position.y / 100) * 6 - 3
          ]}
          onClick={() => onObjectClick(obj)}
        />
      ))}

      <Environment preset="sunset" />
    </>
  )
}

export default Scene3D

