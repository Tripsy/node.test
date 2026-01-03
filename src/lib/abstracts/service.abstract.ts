export interface IEntityCreateService<E> {
	create(data: Partial<E>): Promise<E>;
}

export interface IEntityUpdateService<E> {
	update(data: Partial<E> & { id: number }): Promise<E>;
	updateData(id: number, withDeleted: boolean, data: Partial<E>): Promise<E>;
}

export interface IEntityUpdateStatusService<E, S> {
	updateStatus(
		id: number,
		status: S,
		withDeleted: boolean,
	): Promise<Partial<E>>;
}

export interface IEntityDeleteService<E> {
	delete(id: number): Promise<void>;
}

export interface IEntityRestoreService<E> {
	restore(id: number): Promise<void>;
}

export interface IEntityFindService<E, VDto> {
	findById(id: number, withDeleted: boolean): Promise<E>;
	findByFilter(data: VDto, withDeleted: boolean): Promise<[E[], number]>;
}