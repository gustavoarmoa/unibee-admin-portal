import { LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import { Col, Divider, Input, Row, Spin, message } from 'antd';
import dayjs from 'dayjs';
import { CSSProperties, ChangeEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnClickOutside } from 'usehooks-ts';
import { INVOICE_STATUS, SUBSCRIPTION_STATUS } from '../constants';
import { showAmount } from '../helpers';
import { useRelogin } from '../hooks';
import { appSearchReq } from '../requests';
import { IProfile, UserInvoice } from '../shared.types.d';
import { useAppConfigStore } from '../stores';
import './appSearch.css';

const { Search } = Input;
const APP_PATH = import.meta.env.BASE_URL;

interface IAccountInfo extends IProfile {
  subscriptionId: string;
  subscriptionStatus: number;
}

const Index = () => {
  const navigate = useNavigate();
  const appConfigStore = useAppConfigStore();
  const [term, setTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const resultWrapperRef = useRef(null);
  const [invoiceList, setInvoiceList] = useState<UserInvoice[] | null>(null);
  const [accountList, setAccountList] = useState<IAccountInfo[] | null>(null);
  const relogin = useRelogin();

  const hide = () => setShowResult(false);
  const show = () => setShowResult(true);
  useOnClickOutside(resultWrapperRef, hide);

  const goToDetail = (pageId: string) => {
    hide();
    navigate(`${APP_PATH}${pageId}`);
  };

  const onEnter = async () => {
    if (term.trim() == '') {
      return;
    }

    setSearching(true);
    let res;
    try {
      setSearching(true);
      setShowResult(true);
      res = await appSearchReq(term);
      setSearching(false);
      console.log('app search res: ', res);
      const code = res.data.code;
      if (code != 0) {
        code == 61 && relogin();
        throw new Error(res.data.message);
      }
    } catch (err) {
      setSearching(false);
      setShowResult(false);
      if (err instanceof Error) {
        console.log('profile update err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
      console.log('app search err: ', err);
      return;
    }
    const d = res.data.data;
    setInvoiceList(d.matchInvoice);
    setAccountList(d.matchUserAccounts);
    // d.precisionMatchObject != null &&
  };

  const onTermChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setTerm(evt.target.value);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        position: 'relative',
      }}
    >
      <Search
        value={term}
        onChange={onTermChange}
        onClick={show}
        onPressEnter={onEnter}
        allowClear={true}
        // prefix={<SearchOutlined />}
        placeholder="Search invoiceId, customer email"
        style={{ width: '320px' }}
      />
      <div
        ref={resultWrapperRef}
        style={{
          position: 'absolute',
          top: '52px',
          width: '640px',
          height: '640px',
          visibility: `${showResult ? 'visible' : 'hidden'}`,
          background: '#FAFAFA',
          zIndex: '800',
          border: '1px solid #E0E0E0',
          borderRadius: '6px',
          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px',
        }}
      >
        {searching ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {' '}
            <Spin
              spinning={true}
              indicator={<LoadingOutlined style={{ fontSize: '32px' }} spin />}
            />
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div>precision match</div>
            <Divider
              orientation="left"
              style={{ margin: '2px 0', color: '#757575' }}
            >
              Invoices
            </Divider>
            <InvoiceMatch list={invoiceList} goToDetail={goToDetail} />
            <Divider
              orientation="left"
              style={{ margin: '2px 0', color: '#757575' }}
            >
              Customers
            </Divider>
            <AccountMatch list={accountList} goToDetail={goToDetail} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

const colStyle: CSSProperties = {
  fontWeight: 'bold',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
};

const InvoiceMatch = ({
  list,
  goToDetail,
}: {
  list: UserInvoice[] | null;
  goToDetail: (url: string) => void;
}) => {
  // console.log("inv list: ", list);
  return (
    <>
      <Row
        align={'middle'}
        justify={'space-between'}
        style={{
          display: 'flex',
          width: '100%',
          height: '32px',
          padding: '0 6px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Col span={7} style={colStyle}>
          Title
        </Col>
        <Col span={3} style={colStyle}>
          Status
        </Col>
        <Col span={4} style={colStyle}>
          Amt
        </Col>
        <Col span={5} style={colStyle}>
          Start
        </Col>
        <Col span={5} style={colStyle}>
          End
        </Col>
      </Row>
      {list == null ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          No Match Found
        </div>
      ) : (
        <div
          style={{ maxHeight: '160px', minHeight: '48px', overflowY: 'auto' }}
        >
          {list.map((iv) => (
            <Row
              style={{
                display: 'flex',
                width: '100%',
                height: '32px',
                padding: '0 6px',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#757575',
              }}
              align={'middle'}
              // style={{ height: "32px", margin: "6px 0" }}
              className="clickable-item"
              key={iv.id}
              // onClick={() => console.log("iv clicked: ", iv)}
              onClick={() => goToDetail(`invoice/${iv.invoiceId}`)}
            >
              <Col
                span={7}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span>{iv.invoiceName}</span>
              </Col>
              <Col
                span={3}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '68px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {INVOICE_STATUS[iv.status as keyof typeof INVOICE_STATUS]}
                </div>
              </Col>
              <Col
                span={4}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span>{showAmount(iv.totalAmount, iv.currency)}</span>
              </Col>
              <Col
                span={5}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span>
                  {dayjs(new Date(iv.periodStart * 1000)).format('YYYY-MMM-DD')}
                </span>
              </Col>
              <Col
                span={5}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span>
                  {dayjs(new Date(iv.periodEnd * 1000)).format('YYYY-MMM-DD')}
                </span>
              </Col>
            </Row>
          ))}
        </div>
      )}
    </>
  );
};

const AccountMatch = ({
  list,
  goToDetail,
}: {
  list: IAccountInfo[] | null;
  goToDetail: (url: string) => void;
}) => {
  // console.log("acc matched: ", list);
  return (
    <>
      <Row
        align={'middle'}
        justify={'space-between'}
        style={{
          display: 'flex',
          width: '100%',
          height: '32px',
          padding: '0 6px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Col span={5} style={colStyle}>
          Name
        </Col>
        <Col span={5} style={colStyle}>
          Email
        </Col>
        <Col span={4} style={colStyle}>
          Country
        </Col>
        <Col span={5} style={colStyle}>
          Subscription
        </Col>
        <Col span={5} style={colStyle}>
          Status
        </Col>
      </Row>
      {list == null ? (
        <div className="flex items-center justify-center">No Match Found</div>
      ) : (
        <div
          style={{ maxHeight: '160px', minHeight: '48px', overflowY: 'auto' }}
        >
          {list.map((u) => (
            <Row
              style={{
                display: 'flex',
                width: '100%',
                height: '32px',
                padding: '0 6px',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#757575',
              }}
              align={'middle'}
              // style={{ height: "32px", margin: "6px 0" }}
              className="clickable-item"
              key={u.id}
              onClick={() => goToDetail(`customer/${u.id}`)}
            >
              <Col
                span={5}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{u.firstName}</span>
              </Col>
              <Col
                span={5}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {u.email}
                </div>
              </Col>
              <Col
                span={4}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '68px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {u.countryName}
                </div>
              </Col>
              <Col
                span={5}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span>{u.subscriptionId}</span>
              </Col>
              <Col
                span={5}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span> {SUBSCRIPTION_STATUS[u.subscriptionStatus]}</span>
              </Col>
            </Row>
          ))}
        </div>
      )}
    </>
  );
};

const PrecisionMatch = () => {
  return <div>d</div>;
};
