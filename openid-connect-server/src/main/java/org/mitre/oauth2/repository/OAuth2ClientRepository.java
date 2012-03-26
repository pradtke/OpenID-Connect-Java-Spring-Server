package org.mitre.oauth2.repository;

import java.util.Collection;

import org.mitre.oauth2.model.ClientDetailsEntity;

public interface OAuth2ClientRepository {

	public ClientDetailsEntity getClientById(String clientId);

	public ClientDetailsEntity saveClient(ClientDetailsEntity client);

	public void deleteClient(ClientDetailsEntity client);

	public ClientDetailsEntity updateClient(String clientId, ClientDetailsEntity client);

	public Collection<ClientDetailsEntity> getAllClients();

}