import React, { useState } from 'react';
import axios from 'axios';

const CreateTokenForm: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    symbol: '',
    description: '',
    image: '', // Updated to match the backend
    quantum_key_name: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/encrypt', formData); // Updated endpoint
      console.log(response.data);
    } catch (error) {
      console.error('Error creating token:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="quantum_key_name" placeholder="Quantum Key Name" onChange={handleChange} />
      <input type="text" name="username" placeholder="Username" onChange={handleChange} />
      <input type="text" name="name" placeholder="Token Name" onChange={handleChange} />
      <input type="text" name="symbol" placeholder="Token Symbol" onChange={handleChange} />
      <input type="text" name="description" placeholder="Token Description" onChange={handleChange} />
      <input type="text" name="image" placeholder="Image URL" onChange={handleChange} />
      <button type="submit">Create Token</button>
    </form>
  );
};

export default CreateTokenForm;
