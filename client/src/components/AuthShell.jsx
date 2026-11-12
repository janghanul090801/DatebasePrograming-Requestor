import styled from 'styled-components';
import { FaCheck } from 'react-icons/fa';

const FEATURES = [
  '요청을 저장하고 언제든 다시 실행',
  'Params · Headers · Body를 한 화면에서 편집',
  '응답 상태 코드와 JSON을 바로 확인',
];

const AuthShell = ({ title, subtitle, children, footer }) => {
  return (
    <Page>
      <BrandPanel>
        <Brand>
          <LogoMark>R</LogoMark>
          <span>requestor</span>
        </Brand>

        <Headline>
          Build. Send.
          <br />
          Keep every request.
        </Headline>

        <Description>
          Postman처럼 편리하게 API 요청을 만들고, 저장하고, 다시 불러와 실행해 보세요.
        </Description>

        <FeatureList>
          {FEATURES.map((feature) => (
            <li key={feature}>
              <CheckCircle>
                <FaCheck />
              </CheckCircle>
              {feature}
            </li>
          ))}
        </FeatureList>

        <StackNote>React · Express · MySQL</StackNote>
      </BrandPanel>

      <FormPanel>
        <FormCard>
          <Title>{title}</Title>
          <Subtitle>{subtitle}</Subtitle>
          {children}
        </FormCard>
        {footer}
      </FormPanel>
    </Page>
  );
};

export default AuthShell;

const Page = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  background: #f6f7f9;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const BrandPanel = styled.section`
  position: relative;
  overflow: hidden;
  padding: 56px 64px;
  background: radial-gradient(circle at 15% 15%, #343434 0, #1b1b1b 42%, #121212 100%);
  color: #fff;
  display: flex;
  flex-direction: column;

  &::after {
    content: '';
    position: absolute;
    width: 420px;
    height: 420px;
    border: 1px solid rgba(255, 108, 55, 0.22);
    border-radius: 50%;
    right: -160px;
    bottom: -180px;
    box-shadow:
      0 0 0 70px rgba(255, 108, 55, 0.05),
      0 0 0 140px rgba(255, 108, 55, 0.03);
  }

  @media (max-width: 900px) {
    display: none;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
  z-index: 1;
`;

const LogoMark = styled.span`
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #ff6c37;
  color: #1b1b1b;
  font-size: 20px;
  font-weight: 900;
  transform: rotate(-8deg);
`;

const Headline = styled.h1`
  margin-top: auto;
  padding-top: 80px;
  font-size: clamp(38px, 4.2vw, 58px);
  line-height: 1.12;
  letter-spacing: -0.05em;
  font-weight: 800;
  z-index: 1;
`;

const Description = styled.p`
  margin-top: 24px;
  max-width: 440px;
  color: #b9b9b9;
  font-size: 15px;
  line-height: 1.8;
  z-index: 1;
`;

const FeatureList = styled.ul`
  margin-top: 34px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: #e7e7e7;
  font-size: 14px;
  z-index: 1;

  li {
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

const CheckCircle = styled.span`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 108, 55, 0.15);
  color: #ff6c37;
  font-size: 9px;
`;

const StackNote = styled.p`
  margin-top: auto;
  padding-top: 60px;
  color: #6f6f6f;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  z-index: 1;
`;

const FormPanel = styled.main`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 24px;
`;

const FormCard = styled.div`
  width: 100%;
  max-width: 420px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 18px;
  padding: 36px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.06);

  @media (max-width: 480px) {
    padding: 28px 22px;
    border-radius: 14px;
  }
`;

const Title = styled.h2`
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #171717;
`;

const Subtitle = styled.p`
  margin-top: 8px;
  margin-bottom: 26px;
  color: #868e96;
  font-size: 13px;
  line-height: 1.6;
`;
