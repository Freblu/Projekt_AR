import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

const AtomConnection = ({ scene, elements, selectedAtoms, setSelectedAtoms, setBonds }) => {
  const [atomsOnScene, setAtomsOnScene] = useState([]);  // Atomów, które są na scenie

  useEffect(() => {
    if (selectedAtoms.length === 2) {
      connectAtoms(selectedAtoms[0], selectedAtoms[1]);
      setSelectedAtoms([]); // Resetujemy wybór atomów
    }
  }, [selectedAtoms, setSelectedAtoms]);

  // Funkcja łącząca atomy
  const connectAtoms = (atom1, atom2) => {
    // Sprawdzamy, czy atomy są zdefiniowane
    if (!atom1 || !atom2) {
      console.log('Jeden lub oba atomy są niezdefiniowane.');
      return;
    }

    const geometry = new THREE.CylinderGeometry(0.05, 0.05, atom1.position.distanceTo(atom2.position), 8);
    const material = new THREE.MeshBasicMaterial({ color: 0x0000FF });
    const bond = new THREE.Mesh(geometry, material);

    const midPoint = new THREE.Vector3().addVectors(atom1.position, atom2.position).multiplyScalar(0.5);
    bond.position.copy(midPoint);

    const axis = new THREE.Vector3(0, 1, 0);
    const angle = Math.acos(atom1.position.clone().normalize().dot(atom2.position.clone().normalize()));
    bond.rotation.setFromAxisAngle(axis, angle);

    scene.add(bond);
    setBonds((prevBonds) => [...prevBonds, bond]);
  };

  // Funkcja obsługująca kliknięcie na atom
  const handleAtomClick = (atom, event) => {
    // Sprawdzamy, czy wciśnięto Ctrl (Ctrl do zaznaczania wielu atomów)
    if (event.ctrlKey) {
      setSelectedAtoms((prevAtoms) => [...prevAtoms, atom]);
    } else {
      setSelectedAtoms([atom]);  // Jeśli Ctrl nie jest wciśnięty, wybieramy tylko jeden atom
    }
  };

  useEffect(() => {
    // Przechodzimy przez pierwiastki i dodajemy je do sceny
    elements.forEach((element) => {
      const atom = createAtom(element.atomic_number, element.symbol);
      atom.addEventListener("click", (event) => handleAtomClick(atom, event));
      setAtomsOnScene((prevAtoms) => [...prevAtoms, atom]);  // Atom dodany do listy do pokazania na scenie
    });
  }, [elements]);

  useEffect(() => {
    // Po zaznaczeniu atomów dodajemy je do sceny
    atomsOnScene.forEach((atom) => scene.add(atom));  // Dodajemy atomy do sceny
  }, [atomsOnScene, scene]);

  // Funkcja tworząca atom
  function createAtom(atomicNumber, symbol) {
    const color = new THREE.Color(Math.random(), Math.random(), Math.random()); // Można dostosować kolory
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = symbol;
    sphere.position.x = Math.random() * 2 - 1;  // Losowa pozycja
    sphere.position.y = Math.random() * 2 - 1;
    sphere.position.z = Math.random() * 2 - 1;

    return sphere;
  }

  return null;  // Komponent nie renderuje nic na stronie, tylko manipuluje sceną 3D
};

export default AtomConnection;
