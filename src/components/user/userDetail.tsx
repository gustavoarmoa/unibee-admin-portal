import { LoadingOutlined } from '@ant-design/icons';
import { Button, Spin, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRelogin } from '../../hooks';
import { getUserProfile } from '../../requests';
import { IProfile } from '../../shared.types';
import UserAccountTab from '../subscription/userAccountTab';

const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState<IProfile | null>(null);
  const relogin = useRelogin();

  const fetchUserProfile = async () => {
    const userId = Number(params.userId);
    if (isNaN(userId) || userId < 0) {
      message.error('User not found');
      return;
    }
    try {
      setLoading(true);
      const res = await getUserProfile(userId);
      setLoading(false);
      console.log('res getting user profile: ', res);
      const code = res.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(res.data.message);
      }
      setUserProfile(res.data.data.User);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('profile fetching err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      <UserAccountTab
        user={userProfile}
        setUserProfile={setUserProfile}
        extraButton={
          <Button onClick={() => navigate(`${APP_PATH}customer/list`)}>
            Go Back
          </Button>
        }
      />
    </div>
  );
};

export default Index;
