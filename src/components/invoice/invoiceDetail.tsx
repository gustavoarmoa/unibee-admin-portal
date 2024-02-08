import type { RadioChangeEvent } from 'antd';
import { Button, Checkbox, Form, Input, Radio, Tabs, message } from 'antd';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const APP_PATH = import.meta.env.BASE_URL; // if not specified in build command, default is /
const API_URL = import.meta.env.VITE_API_URL;

const Index = () => {
  const navigate = useNavigate();
  const goBack = () => navigate(`${APP_PATH}invoice/list`);

  useEffect(() => {}, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '200px',
      }}
    >
      Invoice detail
      <div>
        <Button onClick={goBack}>Go Back</Button>
      </div>
    </div>
  );
};

export default Index;
