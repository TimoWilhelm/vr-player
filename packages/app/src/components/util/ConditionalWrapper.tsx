export const ConditionalWrapper = ({
  condition,
  wrapper,
  children,
}: {
  condition: boolean;
  wrapper: (children: React.ReactElement) => JSX.Element;
  children: React.ReactElement;
}) => (condition ? wrapper(children) : children);
