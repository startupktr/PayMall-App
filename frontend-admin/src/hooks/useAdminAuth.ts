import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const useRequireMasterAdmin = () => {
  const { user, loading, isMasterAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/admin/login');
      } else if (!isMasterAdmin) {
        navigate('/admin/unauthorized');
      }
    }
  }, [user, loading, isMasterAdmin, navigate]);

  return { user, loading, isMasterAdmin };
};

export const useRequireMallAdmin = () => {
  const { user, loading, isMallAdmin, isMasterAdmin, assignedMalls } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/admin/login');
      } else if (!isMallAdmin && !isMasterAdmin) {
        navigate('/admin/unauthorized');
      }
    }
  }, [user, loading, isMallAdmin, isMasterAdmin, navigate]);

  return { user, loading, isMallAdmin, isMasterAdmin, assignedMalls };
};

export const useRequireAnyAdmin = () => {
  const { user, loading, isMallAdmin, isMasterAdmin, assignedMalls, roles } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/admin/login');
      } else if (!isMallAdmin && !isMasterAdmin) {
        navigate('/admin/unauthorized');
      }
    }
  }, [user, loading, isMallAdmin, isMasterAdmin, navigate]);

  return { user, loading, isMallAdmin, isMasterAdmin, assignedMalls, roles };
};