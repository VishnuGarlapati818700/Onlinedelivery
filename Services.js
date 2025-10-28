const Services = () => {
  return (
    <section id="services">
      <h2>Our Services</h2>
      <ul style={{ listStyle: 'none', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <li className="service">
          <h3>Same-Day Delivery</h3>
          <p>Fast and efficient delivery within the same day for urgent needs.</p>
        </li>
        <li className="service">
          <h3>Scheduled Deliveries</h3>
          <p>Choose a convenient time for your deliveries.</p>
        </li>
        <li className="service">
          <h3>Home Delivery</h3>
          <p>We bring your products directly to your doorstep.</p>
        </li>
        <li className="service">
          <h3>International Shipping</h3>
          <p>Reliable services for your global delivery needs.</p>
        </li>
      </ul>
    </section>
  );
};

export default Services;
