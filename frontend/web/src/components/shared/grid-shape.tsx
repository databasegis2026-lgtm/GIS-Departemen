export default function GridShape() {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <>
      <div className="pointer-events-none absolute inset-e-0 top-0 -z-1 w-full max-w-62.5 xl:max-w-112.5">
        <img
          width={540}
          height={254}
          src={`${baseUrl}images/shape/grid-01.svg`}
          alt="Decorative grid shape"
        />
      </div>
      <div className="pointer-events-none absolute inset-s-0 bottom-0 -z-1 w-full max-w-62.5 rotate-180 xl:max-w-112.5">
        <img
          width={540}
          height={254}
          src={`${baseUrl}images/shape/grid-01.svg`}
          alt="Decorative grid shape"
        />
      </div>
    </>
  );
}
