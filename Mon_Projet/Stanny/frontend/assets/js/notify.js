// notify.js — Helpers SweetAlert2 pour Stanny
const notify = {
  success: function(message) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: '#10b981',
      color: '#fff',
      iconColor: '#fff'
    });
  },
  error: function(message) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      background: '#ef4444',
      color: '#fff',
      iconColor: '#fff'
    });
  },
  confirm: async function(message) {
    const result = await Swal.fire({
      title: 'Confirmation',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      background: '#131829',
      color: '#fff'
    });
    return result.isConfirmed;
  },
  info: async function(title, message) {
    const result = await Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Oui, continuer',
      cancelButtonText: 'Annuler',
      background: '#131829',
      color: '#fff'
    });
    return result.isConfirmed;
  }
};
