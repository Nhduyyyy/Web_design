export const sceneObjects = {
  1: [ // Quan Công
    {
      id: 'sword',
      name: 'Thanh Kiếm',
      emoji: '⚔️',
      modelPath: '/models/objects/Kiếm.stl', // File 3D STL
      position: { x: 20, y: 30 },
      description: 'Thanh kiếm của Quan Công, biểu tượng của lòng trung thành và dũng cảm',
      details: {
        material: 'Thép cổ truyền',
        meaning: 'Tượng trưng cho sức mạnh và công lý',
        history: 'Kiếm được truyền từ đời này sang đời khác trong các vở Tuồng',
        usage: 'Sử dụng trong các cảnh chiến đấu và biểu diễn võ thuật'
      }
    },
    {
      id: 'helmet',
      name: 'Vương Miện',
      emoji: '👑',
      modelPath: '/models/objects/VươngNiệm.STL', // File 3D STL
      position: { x: 70, y: 25 },
      description: 'Vương miện của Quan Công, thể hiện địa vị và quyền lực',
      details: {
        material: 'Vàng và đá quý',
        meaning: 'Biểu tượng của quyền lực và địa vị cao',
        history: 'Mũ quan là một phần quan trọng trong trang phục Tuồng cổ điển',
        usage: 'Được đội trong các cảnh triều đình và nghi lễ'
      }
    },
    {
      id: 'robe',
      name: 'Áo Giáp Đỏ',
      emoji: '🛡️',
      position: { x: 50, y: 60 },
      description: 'Áo giáp màu đỏ đặc trưng của Quan Công',
      details: {
        material: 'Lụa và kim loại',
        meaning: 'Màu đỏ tượng trưng cho lòng trung thành và dũng cảm',
        history: 'Trang phục truyền thống trong các vở Tuồng về anh hùng',
        usage: 'Mặc trong suốt vở diễn, đặc biệt trong các cảnh chiến đấu'
      }
    },
    {
      id: 'beard',
      name: 'Râu Dài',
      emoji: '🧔',
      position: { x: 30, y: 50 },
      description: 'Râu dài đặc trưng của Quan Công',
      details: {
        material: 'Lông giả',
        meaning: 'Tượng trưng cho sự uy nghiêm và trí tuệ',
        history: 'Một trong những đặc điểm nhận dạng quan trọng của nhân vật',
        usage: 'Phần trang điểm không thể thiếu trong vai diễn Quan Công'
      }
    }
  ],
  2: [ // Thị Kính
    {
      id: 'fan',
      name: 'Quạt',
      emoji: '🪭',
      position: { x: 25, y: 40 },
      description: 'Quạt truyền thống của Thị Kính',
      details: {
        material: 'Giấy và tre',
        meaning: 'Tượng trưng cho sự dịu dàng và nữ tính',
        history: 'Đạo cụ quan trọng trong các vở Tuồng về phụ nữ',
        usage: 'Sử dụng trong các cảnh sinh hoạt và biểu diễn'
      }
    },
    {
      id: 'hairpin',
      name: 'Trâm Cài Tóc',
      emoji: '💍',
      position: { x: 60, y: 20 },
      description: 'Trâm cài tóc tinh tế của Thị Kính',
      details: {
        material: 'Vàng và ngọc trai',
        meaning: 'Biểu tượng của vẻ đẹp và đức hạnh',
        history: 'Trang sức truyền thống trong Tuồng nữ',
        usage: 'Đeo trong các cảnh quan trọng và lễ nghi'
      }
    },
    {
      id: 'dress',
      name: 'Áo Dài Hồng',
      emoji: '👗',
      position: { x: 75, y: 55 },
      description: 'Áo dài màu hồng đặc trưng của Thị Kính',
      details: {
        material: 'Lụa tơ tằm',
        meaning: 'Màu hồng thể hiện sự dịu dàng và nữ tính',
        history: 'Trang phục truyền thống của phụ nữ Việt Nam trong Tuồng',
        usage: 'Mặc trong toàn bộ vở diễn'
      }
    },
    {
      id: 'basket',
      name: 'Giỏ Hoa',
      emoji: '🧺',
      position: { x: 45, y: 70 },
      description: 'Giỏ hoa trong cảnh sinh hoạt hàng ngày',
      details: {
        material: 'Tre và hoa giấy',
        meaning: 'Tượng trưng cho cuộc sống bình dị và hạnh phúc',
        history: 'Đạo cụ thường thấy trong các cảnh đời thường',
        usage: 'Xuất hiện trong các cảnh sinh hoạt gia đình'
      }
    },
    {
      id: 'pot',
      name: 'Nồi Đất',
      emoji: '🍲',
      modelPath: '/models/objects/Nồi.stl', // File 3D STL
      position: { x: 35, y: 80 },
      description: 'Nồi đất nấu ăn trong cảnh sinh hoạt',
      details: {
        material: 'Đất nung',
        meaning: 'Tượng trưng cho cuộc sống gia đình và ấm cúng',
        history: 'Vật dụng quen thuộc trong đời sống dân gian',
        usage: 'Xuất hiện trong các cảnh nấu ăn và sinh hoạt'
      }
    }
  ],
  3: [ // Tam Quốc - Doanh Trại
    {
      id: 'banner',
      name: 'Cờ Hiệu',
      emoji: '🚩',
      position: { x: 20, y: 25 },
      description: 'Cờ hiệu của các phe trong Tam Quốc',
      details: {
        material: 'Vải lụa',
        meaning: 'Tượng trưng cho lòng trung thành và danh dự',
        history: 'Cờ hiệu là biểu tượng quan trọng trong chiến tranh cổ đại',
        usage: 'Xuất hiện trong các cảnh chiến trường và doanh trại'
      }
    },
    {
      id: 'scroll',
      name: 'Cuộn Thư',
      emoji: '📜',
      position: { x: 70, y: 40 },
      description: 'Cuộn thư chứa đựng kế sách',
      details: {
        material: 'Giấy và mực',
        meaning: 'Tượng trưng cho trí tuệ và mưu lược',
        history: 'Đạo cụ quan trọng trong các vở Tuồng về chiến lược',
        usage: 'Xuất hiện trong các cảnh bàn luận và lập kế hoạch'
      }
    },
    {
      id: 'horse',
      name: 'Ngựa Chiến',
      emoji: '🐴',
      modelPath: '/models/objects/Ngựa.stl', // File 3D STL (87MB - file lớn, có thể mất thời gian load)
      position: { x: 50, y: 65 },
      description: 'Ngựa chiến của các tướng quân',
      details: {
        material: 'Gỗ và vải',
        meaning: 'Tượng trưng cho sức mạnh và tốc độ',
        history: 'Ngựa giả được sử dụng trong Tuồng để mô phỏng chiến trường',
        usage: 'Xuất hiện trong các cảnh chiến đấu và di chuyển'
      }
    },
    {
      id: 'drum',
      name: 'Trống Chiến',
      emoji: '🥁',
      position: { x: 80, y: 75 },
      description: 'Trống chiến để điều khiển quân đội',
      details: {
        material: 'Da và gỗ',
        meaning: 'Tượng trưng cho quyền lực chỉ huy',
        history: 'Nhạc cụ quan trọng trong các vở Tuồng về chiến tranh',
        usage: 'Sử dụng trong các cảnh xuất quân và chiến đấu'
      }
    }
  ],
  4: [ // Thị Kính - Vườn Hoa
    {
      id: 'flower',
      name: 'Hoa Sen',
      emoji: '🌸',
      position: { x: 30, y: 30 },
      description: 'Hoa sen trong vườn, biểu tượng của sự thanh khiết',
      details: {
        material: 'Giấy và lụa',
        meaning: 'Tượng trưng cho sự thanh khiết và đức hạnh',
        history: 'Hoa sen là biểu tượng quan trọng trong văn hóa Việt Nam',
        usage: 'Trang trí trong các cảnh vườn và thiên nhiên'
      }
    },
    {
      id: 'pond',
      name: 'Ao Sen',
      emoji: '💧',
      position: { x: 60, y: 50 },
      description: 'Ao sen với nước trong xanh',
      details: {
        material: 'Nước và đá',
        meaning: 'Tượng trưng cho sự bình yên và thanh tịnh',
        history: 'Ao sen thường xuất hiện trong các cảnh vườn truyền thống',
        usage: 'Tạo không gian yên bình trong vở diễn'
      }
    },
    {
      id: 'bridge',
      name: 'Cầu Đá',
      emoji: '🌉',
      position: { x: 50, y: 60 },
      description: 'Cầu đá bắc qua ao sen',
      details: {
        material: 'Đá và gỗ',
        meaning: 'Kết nối giữa các không gian',
        history: 'Kiến trúc truyền thống trong vườn Việt Nam',
        usage: 'Tạo điểm nhấn trong cảnh vườn'
      }
    }
  ],
  5: [ // Tam Quốc - Triều Đình
    {
      id: 'throne',
      name: 'Ngai Vàng',
      emoji: '👑',
      position: { x: 50, y: 30 },
      description: 'Ngai vàng của hoàng đế',
      details: {
        material: 'Vàng và đá quý',
        meaning: 'Tượng trưng cho quyền lực tối cao',
        history: 'Ngai vàng là biểu tượng của hoàng quyền',
        usage: 'Xuất hiện trong các cảnh triều đình'
      }
    },
    {
      id: 'scepter',
      name: 'Quyền Trượng',
      emoji: '⚜️',
      position: { x: 70, y: 40 },
      description: 'Quyền trượng hoàng gia',
      details: {
        material: 'Vàng và ngọc',
        meaning: 'Biểu tượng của quyền lực',
        history: 'Vật phẩm quan trọng trong nghi lễ hoàng gia',
        usage: 'Sử dụng trong các cảnh lễ nghi'
      }
    },
    {
      id: 'scroll2',
      name: 'Sắc Phong',
      emoji: '📜',
      position: { x: 30, y: 50 },
      description: 'Sắc phong của hoàng đế',
      details: {
        material: 'Giấy vàng và mực',
        meaning: 'Tượng trưng cho mệnh lệnh hoàng gia',
        history: 'Văn bản quan trọng trong triều đình',
        usage: 'Xuất hiện trong các cảnh ban thưởng'
      }
    }
  ]
}

export const sceneBackgrounds = {
  1: {
    name: 'Cảnh Chiến Trường',
    description: 'Không gian rộng lớn với cờ xí và vũ khí',
    color: '#8B4513',
    gradient: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    sceneType: 'battlefield',
    skyColor: '#87CEEB',
    groundColor: '#8B4513'
  },
  2: {
    name: 'Cảnh Gia Đình',
    description: 'Không gian ấm cúng của gia đình truyền thống',
    color: '#DDA0DD',
    gradient: 'linear-gradient(135deg, #DDA0DD 0%, #EE82EE 100%)',
    sceneType: 'home',
    skyColor: '#E6E6FA',
    groundColor: '#DDA0DD'
  },
  3: {
    name: 'Cảnh Doanh Trại',
    description: 'Không gian quân sự với bản đồ và vũ khí',
    color: '#4682B4',
    gradient: 'linear-gradient(135deg, #4682B4 0%, #5F9EA0 100%)',
    sceneType: 'camp',
    skyColor: '#87CEEB',
    groundColor: '#4682B4'
  },
  4: {
    name: 'Cảnh Vườn Hoa',
    description: 'Vườn hoa đẹp với cây cối và hoa cỏ',
    color: '#90EE90',
    gradient: 'linear-gradient(135deg, #90EE90 0%, #98FB98 100%)',
    sceneType: 'garden',
    skyColor: '#87CEEB',
    groundColor: '#90EE90'
  },
  5: {
    name: 'Cảnh Triều Đình',
    description: 'Cung điện hoàng gia với kiến trúc cổ kính',
    color: '#DAA520',
    gradient: 'linear-gradient(135deg, #DAA520 0%, #FFD700 100%)',
    sceneType: 'palace',
    skyColor: '#E0E0E0',
    groundColor: '#DAA520'
  }
}

// Map performance to scenes
export const performanceScenes = {
  1: [ // Quan Công - Chiến trường
    { id: 1, name: 'Cảnh 1: Chiến Trường', sceneId: 1 },
    { id: 2, name: 'Cảnh 2: Doanh Trại', sceneId: 3 }
  ],
  2: [ // Thị Kính - Gia đình
    { id: 1, name: 'Cảnh 1: Gia Đình', sceneId: 2 },
    { id: 2, name: 'Cảnh 2: Vườn Hoa', sceneId: 4 }
  ],
  3: [ // Tam Quốc - Quân sự
    { id: 1, name: 'Cảnh 1: Doanh Trại', sceneId: 3 },
    { id: 2, name: 'Cảnh 2: Chiến Trường', sceneId: 1 },
    { id: 3, name: 'Cảnh 3: Triều Đình', sceneId: 5 }
  ]
}

export const sceneList = [
  { id: 1, name: 'Cảnh 1: Chiến Trường', sceneId: 1 },
  { id: 2, name: 'Cảnh 2: Gia Đình', sceneId: 2 },
  { id: 3, name: 'Cảnh 3: Doanh Trại', sceneId: 3 }
]

// Danh sách đạo cụ có file 3D — dùng cho tab 3D View / Đạo cụ
export function getObjectModelsList() {
  const list = []
  let idx = 0
  Object.values(sceneObjects).forEach((arr) => {
    arr.forEach((obj) => {
      if (obj.modelPath) {
        list.push({ ...obj, listId: ++idx })
      }
    })
  })
  return list
}

export const objectModelsList = getObjectModelsList()


