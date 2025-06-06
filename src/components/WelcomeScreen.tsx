
type WelcomeScreenProps = {
  onCreateNew: () => void;
};

const WelcomeScreen = ({onCreateNew}: WelcomeScreenProps) => {
  return (
    <div className="welcome-screen">
      <h1>Welcome to Notepad--</h1>
      <p>Your simple and efficient text editor.</p>
      <p>Start by <a onClick={onCreateNew}>creating a new document</a> or opening an existing one.</p>
    </div>
  );
}

export default WelcomeScreen;