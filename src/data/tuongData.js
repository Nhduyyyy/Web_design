export const maskData = [
  {
    id: 1,
    name: 'Mặt Nạ Quan Văn',
    emoji: '👑',
    modelPath: '/models/masks/mat_na1.glb', // File 3D GLB
    imagePath: '/masks/Ảnh_màn_hình_2026-01-28_lúc_13.43.50-removebg-preview.png', // Ảnh mặt nạ thật (fallback)
    description: 'Mặt nạ đại diện cho các quan văn trong Tuồng',
    color: '#4a90e2',
    details: {
      meaning: 'Tượng trưng cho trí tuệ, học vấn và sự uyên bác',
      history: 'Xuất hiện từ thế kỷ 17, được sử dụng trong các vở Tuồng về triều đình',
      role: 'Thường đóng vai các quan lại, thầy giáo, hoặc người có học thức',
      characteristics: 'Màu sắc thường là xanh dương hoặc trắng, biểu thị sự thanh cao'
    }
  },
  {
    id: 2,
    name: 'Mặt Nạ Quan Võ',
    emoji: '⚔️',
    modelPath: '/models/masks/mac_na2.glb', // File 3D GLB
    imagePath: '/masks/Ảnh_màn_hình_2026-01-28_lúc_13.43.55-removebg-preview.png', // Ảnh mặt nạ thật (fallback)
    description: 'Mặt nạ của các tướng quân, võ tướng',
    color: '#e74c3c',
    details: {
      meaning: 'Biểu tượng của sức mạnh, lòng dũng cảm và lòng trung thành',
      history: 'Có nguồn gốc từ các vở Tuồng về chiến tranh và anh hùng',
      role: 'Đóng vai các tướng quân, anh hùng dân tộc, hoặc người bảo vệ',
      characteristics: 'Màu đỏ hoặc đen, có đường nét mạnh mẽ, góc cạnh'
    }
  },
  {
    id: 3,
    name: 'Mặt Nạ Hề',
    emoji: '🤡',
    imagePath: '/masks/Ảnh_màn_hình_2026-01-28_lúc_13.44.01-removebg-preview.png', // Ảnh mặt nạ thật
    description: 'Mặt nạ của nhân vật hài, giải trí',
    color: '#f39c12',
    details: {
      meaning: 'Đại diện cho sự hài hước, giải trí và làm nhẹ không khí',
      history: 'Xuất hiện để cân bằng cảm xúc trong các vở Tuồng nghiêm túc',
      role: 'Làm cho khán giả cười, giải tỏa căng thẳng trong vở diễn',
      characteristics: 'Màu sắc tươi sáng, nét mặt vui vẻ, thường có mũi to'
    }
  },
  {
    id: 4,
    name: 'Mặt Nạ Nữ',
    emoji: '💃',
    imagePath: '/masks/Ảnh_màn_hình_2026-01-28_lúc_13.44.05-removebg-preview.png', // Ảnh mặt nạ thật
    description: 'Mặt nạ của các nhân vật nữ trong Tuồng',
    color: '#e91e63',
    details: {
      meaning: 'Tượng trưng cho vẻ đẹp, sự dịu dàng và nữ tính',
      history: 'Phát triển để thể hiện các nhân vật nữ trong Tuồng cổ điển',
      role: 'Đóng vai công chúa, tiên nữ, hoặc các nhân vật nữ chính',
      characteristics: 'Đường nét mềm mại, màu sắc nhẹ nhàng như hồng, vàng'
    }
  },
  {
    id: 5,
    name: 'Mặt Nạ Quỷ',
    emoji: '👹',
    imagePath: '/masks/Ảnh_màn_hình_2026-01-28_lúc_13.44.16-removebg-preview.png', // Ảnh mặt nạ thật
    description: 'Mặt nạ của các nhân vật phản diện',
    color: '#8e44ad',
    details: {
      meaning: 'Đại diện cho cái ác, sự phản bội và thử thách',
      history: 'Sử dụng để tạo sự tương phản với các nhân vật chính diện',
      role: 'Đóng vai kẻ thù, phản diện, hoặc nhân vật gây xung đột',
      characteristics: 'Màu tối, đường nét dữ tợn, thường có răng nanh hoặc sừng'
    }
  },
  {
    id: 6,
    name: 'Mặt Nạ Thần',
    emoji: '✨',
    imagePath: '/masks/Ảnh_màn_hình_2026-01-28_lúc_13.44.21-removebg-preview.png', // Ảnh mặt nạ thật
    description: 'Mặt nạ của các vị thần, tiên',
    color: '#00bcd4',
    details: {
      meaning: 'Tượng trưng cho quyền năng siêu nhiên, sự thiêng liêng',
      history: 'Xuất hiện trong các vở Tuồng về thần thoại và tôn giáo',
      role: 'Đóng vai các vị thần, tiên, hoặc nhân vật có quyền năng đặc biệt',
      characteristics: 'Màu sắc sáng, có ánh sáng hoặc hoa văn đặc biệt'
    }
  }
]

export const characterData = [
  {
    id: 1,
    name: 'Quan Công',
    type: 'Quan Võ',
    emoji: '⚔️',
    costume: {
      color: 'Đỏ',
      description: 'Áo giáp đỏ, mũ quan, râu dài',
      meaning: 'Màu đỏ tượng trưng cho lòng trung thành và dũng cảm'
    },
    role: 'Nhân vật anh hùng, tướng quân trung nghĩa',
    story: 'Quan Công là một trong những nhân vật nổi tiếng nhất trong Tuồng, đại diện cho lòng trung thành tuyệt đối'
  },
  {
    id: 2,
    name: 'Thị Kính',
    type: 'Nữ',
    emoji: '💃',
    costume: {
      color: 'Hồng',
      description: 'Áo dài truyền thống, khăn đóng, trang sức tinh tế',
      meaning: 'Màu hồng thể hiện sự dịu dàng và nữ tính'
    },
    role: 'Nhân vật nữ chính, đại diện cho đức hạnh',
    story: 'Thị Kính là biểu tượng của người phụ nữ Việt Nam với đức tính hiền thảo, chịu thương chịu khó'
  },
  {
    id: 3,
    name: 'Lưu Bị',
    type: 'Quan Văn',
    emoji: '👑',
    costume: {
      color: 'Vàng',
      description: 'Áo long bào vàng, mũ miện, giày quan',
      meaning: 'Màu vàng tượng trưng cho quyền lực và địa vị cao'
    },
    role: 'Vua, lãnh đạo nhân từ',
    story: 'Lưu Bị được miêu tả là một vị vua nhân từ, luôn quan tâm đến dân chúng'
  }
]


