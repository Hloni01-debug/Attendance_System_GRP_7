export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-ZA');
};

export const formatDateTime = (dateString, format = 'full') => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (format === 'full') {
    return date.toLocaleString('en-ZA');
  }
  if (format === 'date') {
    return date.toLocaleDateString('en-ZA');
  }
  return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
};

export const formatTimeOnly = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRoleName = (role) => {
  const roles = {
    admin: 'Administrator',
    driver: 'Driver',
    finance: 'Finance Admin',
    warehouse: 'Warehouse Staff',
  };
  return roles[role] || role;
};

export const getRoleColor = (role) => {
  const colors = {
    admin: 'badge-danger',
    driver: 'badge-info',
    finance: 'badge-warning',
    warehouse: 'badge-success',
  };
  return colors[role] || 'badge-secondary';
};

export const getStatusColor = (status) => {
  const colors = {
    pending: 'badge-secondary',
    in_transit: 'badge-warning',
    delivered: 'badge-success',
    failed: 'badge-danger',
    returned: 'badge-info',
  };
  return colors[status] || 'badge-secondary';
};