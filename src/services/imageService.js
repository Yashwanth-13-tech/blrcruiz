/**
 * Service for handling car image uploads, compression, validation, and storage.
 */
export const imageService = {
  /**
   * Validate image file format and size (max 10MB before compression)
   */
  validateFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/avif']
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Unsupported image format. Please upload JPG, PNG, or WebP.',
      }
    }
    const maxSizeBytes = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: 'File size exceeds 10MB limit. Please upload a smaller image.',
      }
    }
    return { valid: true }
  },

  /**
   * Compress and convert an image file to a high-quality WebP/JPEG data URL
   * @param {File} file
   * @param {number} maxWidth - default 1200px
   * @param {number} quality - default 0.85
   */
  async processAndCompress(file, maxWidth = 1200, quality = 0.85) {
    const validation = this.validateFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)

      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result

        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          // Try webp first, fallback to jpeg
          try {
            const dataUrl = canvas.toDataURL('image/webp', quality)
            resolve(dataUrl)
          } catch {
            const dataUrl = canvas.toDataURL('image/jpeg', quality)
            resolve(dataUrl)
          }
        }

        img.onerror = () => reject(new Error('Failed to load image for processing.'))
      }

      reader.onerror = () => reject(new Error('Failed to read file.'))
    })
  },

  /**
   * Process multiple files in parallel
   */
  async processMultipleFiles(files) {
    const promises = Array.from(files).map((file) => this.processAndCompress(file))
    return await Promise.all(promises)
  },
}

export default imageService
