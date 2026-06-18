import Header from '@/components/Header';
import Toolbar from '@/components/Toolbar';
import BlueprintCanvas from '@/components/BlueprintCanvas';
import DetailPanel from '@/components/DetailPanel';
import ReviewPanel from '@/components/ReviewPanel';

const Home = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-horror-bg overflow-hidden">
      <Header />
      <div className="flex-1 flex min-h-0">
        <Toolbar />
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <BlueprintCanvas />
          <ReviewPanel />
        </div>
        <DetailPanel />
      </div>
    </div>
  );
};

export default Home;
