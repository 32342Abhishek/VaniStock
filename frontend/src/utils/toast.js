import toast from 'react-hot-toast'

export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  const data = err?.response?.data
  if (typeof data?.detail === 'string') return data.detail
  if (data?.detail?.message) return data.detail.message
  if (data?.error?.message) return data.error.message
  if (data?.message) return data.message
  if (err?.message) return err.message
  return fallback
}

export function showErrorToast(err, fallback = 'Something went wrong') {
  toast.error(getApiErrorMessage(err, fallback), {
    duration: 5000,
    id: 'app-error-toast',
  })
}

export function showSuccessToast(message, options = {}) {
  toast.success(message, {
    duration: 3000,
    ...options,
  })
}

export function showInfoToast(message) {
  toast(message, {
    icon: 'ℹ️',
    duration: 3500,
  })
}
