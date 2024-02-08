import { useNavigate } from 'react-router-dom';
const APP_PATH = import.meta.env.BASE_URL;

export const useRelogin = () => {
  const navigate = useNavigate();
  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: 'session expired, please re-login' },
    });
  return relogin;
};
