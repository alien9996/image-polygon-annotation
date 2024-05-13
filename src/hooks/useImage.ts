export default function useImage() {
  const readFile = (file: File | undefined, callback: (reader: FileReader | null) => void) => {
    try {
      if (!file) {
        throw new Error('File is empty')
      }
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        callback(reader)
      }
    } catch (error) {
      callback(null)
    }
  }

  const bufferToBase64 = (buffer: Buffer) => {
    return Buffer.from(buffer).toString('base64')
  }

  const createImage: (src: string) => Promise<HTMLImageElement> = (src: string) => {
    try {
      return new Promise((resolve, reject) => {
        const _image = new Image()
        _image.src = src || ''
        _image.onload = () => {
          resolve(_image)
        }
        _image.onerror = () => {
          reject(`Can't load image: ${src}`)
        }
      })
    } catch (error) {
      console.warn(error, 'createImage')
      return new Promise((resolve) => resolve(new Image()))
    }
  }

  const validateSize = (file: File | undefined, size?: number) => {
    if (file) {
      const _size = size ? size : 100 //Mb
      const isLt2M = file.size / 1024 / 1024 <= _size
      return isLt2M
    }
    return false
  }

  const validateListSize = (files: (File | undefined)[], size?: number) => {
    if (files) {
      const _size = size ? size : 100 //Mb
      const errFiles = files.filter((f) => {
        if (f) {
          return f.size / 1024 / 1024 > _size
        }
        return true
      })
      return errFiles.length <= 0
    }
  }
  return { readFile, validateSize, validateListSize, bufferToBase64, createImage }
}
